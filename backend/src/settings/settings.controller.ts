import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto, SepayApiKeyDto, SepayAccountDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface SepayBankAccount {
  id: string;
  account_holder_name: string;
  account_number: string;
  accumulated: string;
  bank_short_name: string;
  bank_full_name: string;
  bank_bin: string;
  bank_code: string;
  active: string;
}

interface SepayBankAccountsResponse {
  status: number;
  bankaccounts: SepayBankAccount[];
}

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly httpService: HttpService,
  ) {}

  // ── SePay Configuration ──

  @Get('sepay')
  async getSepayConfig() {
    const keys = await this.settingsService.getMany([
      'sepay_api_key',
      'sepay_account_number',
      'sepay_bank_name',
      'sepay_bank_bin',
      'sepay_account_holder',
    ]);
    return {
      apiKeySet: !!keys.sepay_api_key,
      apiKeyPreview: keys.sepay_api_key
        ? keys.sepay_api_key.slice(0, 5)
        : null,
      accountNumber: keys.sepay_account_number,
      bankName: keys.sepay_bank_name,
      bankBin: keys.sepay_bank_bin,
      accountHolder: keys.sepay_account_holder,
    };
  }

  @Put('sepay/api-key')
  async setSepayApiKey(@Body() body: SepayApiKeyDto) {
    if (!body.apiKey?.trim()) {
      throw new BadRequestException('API key is required');
    }
    await this.settingsService.set('sepay_api_key', body.apiKey.trim());
    return { success: true };
  }

  @Post('sepay/api-key/remove')
  async removeSepayApiKey() {
    await this.settingsService.delete('sepay_api_key');
    await this.settingsService.delete('sepay_account_number');
    await this.settingsService.delete('sepay_bank_name');
    await this.settingsService.delete('sepay_bank_bin');
    await this.settingsService.delete('sepay_account_holder');
    return { success: true };
  }

  @Get('sepay/accounts')
  async listSepayAccounts() {
    const apiKey = await this.settingsService.get('sepay_api_key');
    if (!apiKey) {
      throw new BadRequestException('SePay API key not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<SepayBankAccountsResponse>(
          'https://my.sepay.vn/userapi/bankaccounts/list',
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              Accept: 'application/json',
            },
            timeout: 10000,
          },
        ),
      );

      return response.data?.bankaccounts ?? [];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown';
      throw new BadRequestException(`SePay API error: ${message}`);
    }
  }

  @Put('sepay/account')
  async setSepayAccount(@Body() body: SepayAccountDto) {
    if (!body.accountNumber || !body.bankName) {
      throw new BadRequestException(
        'Account number and bank name are required',
      );
    }
    await this.settingsService.set('sepay_account_number', body.accountNumber);
    await this.settingsService.set('sepay_bank_name', body.bankName);
    await this.settingsService.set('sepay_bank_bin', body.bankBin ?? '');
    await this.settingsService.set('sepay_account_holder', body.accountHolder ?? '');
    return { success: true };
  }

  @Get('sepay/status')
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  async getSepayStatus() {
    const apiKey = await this.settingsService.get('sepay_api_key');
    const accountNumber = await this.settingsService.get('sepay_account_number');

    if (!apiKey) {
      return { configured: false, valid: false, message: 'API key not set' };
    }

    if (!accountNumber) {
      return {
        configured: true,
        valid: false,
        message: 'No bank account selected',
      };
    }

    // Test the API key by listing bank accounts
    try {
      const response = await firstValueFrom(
        this.httpService.get<SepayBankAccountsResponse>(
          'https://my.sepay.vn/userapi/bankaccounts/list',
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              Accept: 'application/json',
            },
            timeout: 10000,
          },
        ),
      );

      if (response.data?.status === 200) {
        return { configured: true, valid: true, message: 'Connected' };
      }
      return { configured: true, valid: false, message: 'Invalid API key' };
    } catch {
      return {
        configured: true,
        valid: false,
        message: 'API key invalid or network error',
      };
    }
  }

  // ── Generic Settings ──

  @Put()
  async setSetting(@Body() dto: UpdateSettingDto) {
    await this.settingsService.set(dto.key, dto.value);
    return { success: true };
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    const value = await this.settingsService.get(key);
    return { key, value };
  }
}
