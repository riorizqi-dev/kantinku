declare module "midtrans-client" {
  export class Snap {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });
    apiConfig?: unknown;
    createTransaction(parameter: Record<string, unknown>): Promise<{
      token: string;
      redirect_url: string;
    }>;
  }
  export class CoreApi {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });
  }
}
