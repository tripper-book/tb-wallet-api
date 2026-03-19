import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/** PayU Verify Payment API response for one transaction (legacy: transaction_details[txnid]; v2: result[0]). */
export interface PayuTransactionDetails {
  mihpayid?: string;
  mihpayId?: number;
  status?: string;
  unmappedstatus?: string;
  unmappedStatus?: string;
  amt?: string;
  amount?: number;
  transaction_amount?: string;
  originalAmount?: number;
  net_amount_debit?: string;
  netDebitAmount?: number;
  bank_ref_num?: string;
  bankReferenceNumber?: string;
  mode?: string;
  PG_TYPE?: string;
  pgType?: string;
  bankcode?: string;
  error_code?: string;
  errorCode?: string;
  error_Message?: string;
  errorMessage?: string;
  field9?: string;
  addedon?: string;
  addedOn?: string;
  productinfo?: string;
  productInfo?: string;
  firstname?: string;
  firstName?: string;
  card_no?: string;
  cardNo?: string;
  txnId?: string;
  message?: string;
  [key: string]: unknown;
}

/**
 * PayU Hosted Checkout (Web Integration).
 * - Integration: https://docs.payu.in/docs/prebuilt-checkout-page-integration
 * - Hash (Hosted): https://docs.payu.in/docs/generate-hash-payu-hosted
 * - Hash (Merchant Hosted / same format): https://docs.payu.in/docs/generate-hash-merchant-hosted
 * Request: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 * Response: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export interface PayuPaymentParams {
  paymentUrl: string;
  params: Record<string, string>;
}

export interface PayuCallbackPayload {
  status: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  mihpayid?: string;
  bank_ref_num?: string;
  error?: string;
  error_Message?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  hash: string;
  [key: string]: string | undefined;
}

@Injectable()
export class PayuService {
  private readonly key: string;
  private readonly salt: string;
  private readonly paymentUrl: string;
  private readonly successUrl: string;
  private readonly failureUrl: string;
  private readonly successRedirectUrl: string;
  private readonly failureRedirectUrl: string;

  constructor() {
    this.key = process.env.PAYU_MERCHANT_KEY || '';
    this.salt = process.env.PAYU_MERCHANT_SALT || '';
    const env = (process.env.PAYU_ENVIRONMENT || 'TEST').toUpperCase();
    this.paymentUrl =
      env === 'LIVE'
        ? 'https://secure.payu.in/_payment'
        : 'https://test.payu.in/_payment';
    this.successUrl = process.env.PAYU_SUCCESS_URL || '';
    this.failureUrl = process.env.PAYU_FAILURE_URL || '';
    this.successRedirectUrl = process.env.PAYU_SUCCESS_REDIRECT_URL || '';
    this.failureRedirectUrl = process.env.PAYU_FAILURE_REDIRECT_URL || '';
  }

  isConfigured(): boolean {
    return !!(this.key && this.salt && this.successUrl && this.failureUrl);
  }

  /**
   * Build payment params for Hosted Checkout.
   * Amount: PayU expects decimal string (e.g. "10.00" for ₹10). We receive amount_cents (paise).
   */
  getPaymentParams(params: {
    txnid: string;
    amountCents: string;
    currency: string;
    productinfo: string;
    firstname: string;
    email: string;
    phone: string;
    lastname?: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  }): PayuPaymentParams {
    const amount = (Number(params.amountCents) / 100).toFixed(2);
    const udf1 = params.udf1 ?? '';
    const udf2 = params.udf2 ?? '';
    const udf3 = params.udf3 ?? '';
    const udf4 = params.udf4 ?? '';
    const udf5 = params.udf5 ?? '';

    // PayU Scenario 1 (with UDF): key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT (5 empty fields before SALT; doc sample uses 6 pipes, PayU validation accepts 5)
    const hashString = [
      this.key,
      params.txnid,
      amount,
      params.productinfo,
      params.firstname,
      params.email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      '',
      '',
      '',
      '',
      '',
      this.salt,
    ].join('|');
    const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();

    const formParams: Record<string, string> = {
      key: this.key,
      txnid: params.txnid,
      amount,
      productinfo: params.productinfo,
      firstname: params.firstname,
      email: params.email,
      phone: params.phone,
      surl: this.successUrl,
      furl: this.failureUrl,
      hash,
    };
    if (params.lastname) formParams.lastname = params.lastname;
    if (udf1) formParams.udf1 = udf1;
    if (udf2) formParams.udf2 = udf2;
    if (udf3) formParams.udf3 = udf3;
    if (udf4) formParams.udf4 = udf4;
    if (udf5) formParams.udf5 = udf5;

    return { paymentUrl: this.paymentUrl, params: formParams };
  }

  /**
   * Verify response hash from PayU callback (surl/furl).
   * Reverse hash: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
   * Doc uses 6 pipes after status; PayU may use 5 to mirror request format - try both.
   */
  verifyResponse(payload: PayuCallbackPayload): boolean {
    const receivedHash = (payload.hash ?? payload.Hash ?? '').toString().trim();
    if (!receivedHash) return false;
    const status = (payload.status ?? payload.Status ?? '').toString();
    const udf1 = (payload.udf1 ?? '').toString();
    const udf2 = (payload.udf2 ?? '').toString();
    const udf3 = (payload.udf3 ?? '').toString();
    const udf4 = (payload.udf4 ?? '').toString();
    const udf5 = (payload.udf5 ?? '').toString();
    const email = (payload.email ?? payload.Email ?? '').toString();
    const firstname = (payload.firstname ?? '').toString();
    const productinfo = (payload.productinfo ?? '').toString();
    const amount = (payload.amount ?? '').toString();
    const txnid = (payload.txnid ?? '').toString();

    const buildHashString = (emptyCount: number) =>
      [
        this.salt,
        status,
        ...Array(emptyCount).fill(''),
        udf5,
        udf4,
        udf3,
        udf2,
        udf1,
        email,
        firstname,
        productinfo,
        amount,
        txnid,
        this.key,
      ].join('|');

    const computed6 = crypto.createHash('sha512').update(buildHashString(6)).digest('hex').toLowerCase();
    const computed5 = crypto.createHash('sha512').update(buildHashString(5)).digest('hex').toLowerCase();
    const received = receivedHash.toLowerCase();
    return computed6 === received || computed5 === received;
  }

  getSuccessRedirectUrl(orderId?: string): string {
    if (!this.successRedirectUrl) return '';
    if (orderId) return `${this.successRedirectUrl}${this.successRedirectUrl.includes('?') ? '&' : '?'}order_id=${orderId}`;
    return this.successRedirectUrl;
  }

  getFailureRedirectUrl(orderId?: string): string {
    if (!this.failureRedirectUrl) return '';
    if (orderId) return `${this.failureRedirectUrl}${this.failureRedirectUrl.includes('?') ? '&' : '?'}order_id=${orderId}`;
    return this.failureRedirectUrl;
  }

  /**
   * Fetch transaction details from PayU. Tries v2 Verify Payment API (v3/transaction) first,
   * then legacy postservice?form=2. See https://docs.payu.in/v2/reference/v2_verify_payment_api
   */
  async verifyPayment(txnId: string): Promise<PayuTransactionDetails | null> {
    if (!this.key || !this.salt) return null;
    const v2Result = await this.verifyPaymentV2(txnId);
    if (v2Result) return v2Result;
    return this.verifyPaymentLegacy(txnId);
  }

  /**
   * PayU v2 Verify Payment API: POST v3/transaction with HMAC auth.
   * Hash: sha512(request_body + '|' + date + '|' + merchant_secret). merchant_secret = SALT.
   */
  private async verifyPaymentV2(txnId: string): Promise<PayuTransactionDetails | null> {
    const bodyJson = JSON.stringify({ txnId: [txnId] });
    const date = new Date().toUTCString();
    const hashString = bodyJson + '|' + date + '|' + this.salt;
    const signature = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
    const authorization = `hmac username="${this.key}", algorithm="sha512", headers="date", signature="${signature}"`;
    const baseUrl =
      (process.env.PAYU_ENVIRONMENT || 'TEST').toUpperCase() === 'LIVE'
        ? 'https://info.payu.in/v3/transaction'
        : 'https://test.payu.in/v3/transaction';
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          date,
          authorization,
          'Info-Command': 'verify_payment',
        },
        body: bodyJson,
      });
      const data = (await res.json()) as {
        status?: number;
        result?: Array<PayuTransactionDetails & { message?: string }>;
      };
      if (data.status !== 1 || !Array.isArray(data.result) || data.result.length === 0) return null;
      const first = data.result[0];
      if (first.message === 'not found' || first.status === undefined) return null;
      return this.normalizeVerifyResult(first);
    } catch {
      return null;
    }
  }

  /** Normalize v2 (camelCase) or legacy (snake_case) result so UI gets consistent keys. */
  private normalizeVerifyResult(r: PayuTransactionDetails): PayuTransactionDetails {
    return {
      ...r,
      mihpayid: r.mihpayid ?? (r.mihpayId != null ? String(r.mihpayId) : undefined),
      bank_ref_num: r.bank_ref_num ?? r.bankReferenceNumber,
      amt: r.amt ?? (r.amount != null ? String(r.amount) : undefined),
      net_amount_debit: r.net_amount_debit ?? (r.netDebitAmount != null ? String(r.netDebitAmount) : undefined),
      error_code: r.error_code ?? r.errorCode,
      error_Message: r.error_Message ?? r.errorMessage,
      addedon: r.addedon ?? r.addedOn,
      productinfo: r.productinfo ?? r.productInfo,
      firstname: r.firstname ?? r.firstName,
      card_no: r.card_no ?? r.cardNo,
      unmappedstatus: r.unmappedstatus ?? r.unmappedStatus,
    };
  }

  /**
   * Legacy Verify Payment API (postservice?form=2). Hash: sha512(key|command|var1|salt).
   */
  private async verifyPaymentLegacy(txnId: string): Promise<PayuTransactionDetails | null> {
    const command = 'verify_payment';
    const var1 = txnId;
    const hashString = [this.key, command, var1, this.salt].join('|');
    const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
    const baseUrl =
      (process.env.PAYU_ENVIRONMENT || 'TEST').toUpperCase() === 'LIVE'
        ? 'https://info.payu.in/merchant/postservice'
        : 'https://test.payu.in/merchant/postservice';
    const url = `${baseUrl}?form=2`;
    const body = new URLSearchParams({ key: this.key, command, var1, hash });
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const data = (await res.json()) as {
        status?: number;
        transaction_details?: Record<string, PayuTransactionDetails>;
      };
      if (data.status !== 1 || !data.transaction_details?.[txnId]) return null;
      return this.normalizeVerifyResult(data.transaction_details[txnId]);
    } catch {
      return null;
    }
  }
}
