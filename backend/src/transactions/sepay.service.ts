import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from '../settings/settings.service';

export interface SepayTransaction {
  id: string;
  bank_brand_name: string;
  account_number: string;
  transaction_date: string;
  amount_out: string;
  amount_in: string;
  accumulated: string;
  transaction_content: string;
  reference_number: string;
  code: string | null;
  sub_account: string | null;
  bank_account_id: string;
}

interface SepayResponse {
  status: number;
  error: unknown;
  messages: { success: boolean };
  transactions: SepayTransaction[];
}

@Injectable()
export class SePayService {
  private readonly logger = new Logger(SePayService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
  ) {}

  async listTransactions(limit = 5000): Promise<SepayTransaction[]> {
    const apiKey = await this.settingsService.get('sepay_api_key');
    if (!apiKey) {
      throw new BadRequestException('SePay API key not configured');
    }

    const accountNumber = await this.settingsService.get('sepay_account_number');
    if (!accountNumber) {
      throw new BadRequestException('SePay bank account not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<SepayResponse>(
          'https://my.sepay.vn/userapi/transactions/list',
          {
            params: {
              account_number: accountNumber,
              limit,
            },
            headers: {
              Authorization: `Bearer ${apiKey}`,
              Accept: 'application/json',
            },
            timeout: 15000,
          },
        ),
      );

      return response.data?.transactions ?? [];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(`SePay list error: ${message}`);
      throw new BadRequestException(`SePay API error: ${message}`);
    }
  }

  async findTransactionByCode(
    code: string,
    amount: number,
  ): Promise<SepayTransaction | null> {
    const txs = await this.listTransactions(100);
    return (
      txs.find(
        (tx) =>
          tx.transaction_content?.includes(code) &&
          Number(tx.amount_in) === amount,
      ) ?? null
    );
  }

  async findTransactionForAmount(
    amount: number,
  ): Promise<SepayTransaction | null> {
    const txs = await this.listTransactions(50);
    return txs.find((tx) => Number(tx.amount_in) === amount) ?? null;
  }
}
