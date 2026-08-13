import { IWhatsAppService } from './interface';
import { BaileysWhatsAppProvider } from './baileys-provider';

const globalForWhatsApp = globalThis as unknown as {
  whatsAppService: BaileysWhatsAppProvider;
};

export const whatsAppService: BaileysWhatsAppProvider =
  globalForWhatsApp.whatsAppService || new BaileysWhatsAppProvider();

if (process.env.NODE_ENV !== 'production') {
  globalForWhatsApp.whatsAppService = whatsAppService;
}

export * from './interface';
