import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PayuCallbackPayload } from './payu.service';
import { OrdersService } from './orders.service';
import { PayuService } from './payu.service';

/**
 * Public endpoints for PayU Hosted Checkout callbacks (surl/furl).
 * PayU POSTs form-urlencoded data here. No auth.
 */
@ApiTags('orders')
@Controller('orders/payu')
export class PayuCallbackController {
  private readonly logger = new Logger(PayuCallbackController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly payuService: PayuService,
  ) {}

  @Post('success')
  @ApiExcludeEndpoint()
  async success(
    @Body() payload: PayuCallbackPayload,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    this.logger.log(`PayU success callback received, txnid=${payload?.txnid ?? 'n/a'}, status=${payload?.status ?? 'n/a'}`);
    const result = await this.ordersService.handlePayuCallback(true, payload);
    const redirectUrl =
      result?.redirectUrl ||
      this.payuService.getSuccessRedirectUrl(result?.orderId ?? undefined);
    if (result) {
      this.logger.log(`PayU success processed, orderId=${result.orderId}, redirecting`);
    } else {
      this.logger.warn(`PayU success callback not processed (hash fail or order not found), txnid=${payload?.txnid ?? 'n/a'}`);
    }
    if (redirectUrl) {
      res.redirect(302, redirectUrl);
    } else {
      res.status(200).send('OK');
    }
  }

  @Post('failure')
  @ApiExcludeEndpoint()
  async failure(
    @Body() payload: PayuCallbackPayload,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    this.logger.log(`PayU failure callback received, txnid=${payload?.txnid ?? 'n/a'}`);
    const result = await this.ordersService.handlePayuCallback(false, payload);
    const redirectUrl =
      result?.redirectUrl ||
      this.payuService.getFailureRedirectUrl(result?.orderId ?? undefined);
    if (redirectUrl) {
      res.redirect(302, redirectUrl);
    } else {
      res.status(200).send('OK');
    }
  }
}
