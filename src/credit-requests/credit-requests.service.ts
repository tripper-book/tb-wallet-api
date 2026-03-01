import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/current-user.decorator';
import { TransactionReferenceType, TransactionType } from '../transactions/entities/transaction-type.enum';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallets/wallets.service';
import { CreateCreditRequestDto } from './dto/create-credit-request.dto';
import { CreditRequest } from './entities/credit-request.entity';
import { CreditRequestLog } from './entities/credit-request-log.entity';
import { CreditRequestLogAction, CreditRequestStatus } from './entities/credit-request-status.enum';

@Injectable()
export class CreditRequestsService {
  constructor(
    @InjectRepository(CreditRequest)
    private readonly creditRequestRepo: Repository<CreditRequest>,
    @InjectRepository(CreditRequestLog)
    private readonly logRepo: Repository<CreditRequestLog>,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(reqUser: RequestUser, dto: CreateCreditRequestDto): Promise<CreditRequest> {
    const user = await this.usersService.getOrCreateFromRequestUser(reqUser);
    const request = this.creditRequestRepo.create({
      user_id: user.id,
      amount_cents: dto.amount_cents,
      currency: dto.currency ?? 'INR',
      status: CreditRequestStatus.PENDING_APPROVAL,
      notes: dto.notes ?? null,
    });
    await this.creditRequestRepo.save(request);
    await this.addLog(request.id, CreditRequestLogAction.REQUESTED, reqUser.id, null, CreditRequestStatus.PENDING_APPROVAL, dto.notes ?? null);
    return request;
  }

  async findMyRequests(reqUser: RequestUser, limit = 20, offset = 0): Promise<{ items: CreditRequest[]; total: number }> {
    const user = await this.usersService.getOrCreateFromRequestUser(reqUser);
    const [items, total] = await this.creditRequestRepo.findAndCount({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
    });
    return { items, total };
  }

  /** Admin: list all credit requests with optional status filter and pagination. */
  async findAll(options: { limit?: number; offset?: number; status?: CreditRequestStatus } = {}): Promise<{ items: CreditRequest[]; total: number }> {
    const { limit = 20, offset = 0, status } = options;
    const take = Math.min(limit, 100);
    const qb = this.creditRequestRepo.createQueryBuilder('cr').orderBy('cr.created_at', 'DESC');
    if (status) {
      qb.andWhere('cr.status = :status', { status });
    }
    const [items, total] = await qb.take(take).skip(offset).getManyAndCount();
    return { items, total };
  }

  /** Admin: get credit request by id with user relation. */
  async findOneById(id: string): Promise<CreditRequest> {
    const request = await this.creditRequestRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!request) throw new NotFoundException('Credit request not found');
    return request;
  }

  async approve(id: string, adminUserId: string, adminNotes?: string): Promise<CreditRequest> {
    const request = await this.creditRequestRepo.findOne({ where: { id }, relations: ['user'] });
    if (!request) throw new NotFoundException('Credit request not found');
    if (request.status !== CreditRequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Credit request is not pending (status: ${request.status})`);
    }
    const oldStatus = request.status;
    request.status = CreditRequestStatus.APPROVED;
    request.reviewed_at = new Date();
    request.reviewed_by = adminUserId;
    request.admin_notes = adminNotes ?? null;
    await this.creditRequestRepo.save(request);
    await this.addLog(request.id, CreditRequestLogAction.APPROVED, adminUserId, oldStatus, CreditRequestStatus.APPROVED, adminNotes ?? null);

    const newBalance = await this.walletService.credit(
      request.user_id,
      request.amount_cents,
      TransactionReferenceType.CREDIT_REQUEST,
      request.id,
    );
    await this.transactionsService.log(
      request.user_id,
      TransactionType.CREDIT,
      request.amount_cents,
      newBalance,
      TransactionReferenceType.CREDIT_REQUEST,
      request.id,
      { credit_request_id: request.id },
    );
    return request;
  }

  async reject(id: string, adminUserId: string, adminNotes?: string): Promise<CreditRequest> {
    const request = await this.creditRequestRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Credit request not found');
    if (request.status !== CreditRequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Credit request is not pending (status: ${request.status})`);
    }
    const oldStatus = request.status;
    request.status = CreditRequestStatus.REJECTED;
    request.reviewed_at = new Date();
    request.reviewed_by = adminUserId;
    request.admin_notes = adminNotes ?? null;
    await this.creditRequestRepo.save(request);
    await this.addLog(request.id, CreditRequestLogAction.REJECTED, adminUserId, oldStatus, CreditRequestStatus.REJECTED, adminNotes ?? null);
    return request;
  }

  async getLogs(creditRequestId: string): Promise<CreditRequestLog[]> {
    return this.logRepo.find({
      where: { credit_request_id: creditRequestId },
      order: { created_at: 'ASC' },
    });
  }

  private async addLog(
    creditRequestId: string,
    action: CreditRequestLogAction,
    performedBy: string,
    oldStatus: string | null,
    newStatus: string | null,
    notes: string | null,
  ): Promise<CreditRequestLog> {
    const log = this.logRepo.create({
      credit_request_id: creditRequestId,
      action,
      performed_by: performedBy,
      old_status: oldStatus,
      new_status: newStatus,
      notes,
    });
    return this.logRepo.save(log);
  }
}
