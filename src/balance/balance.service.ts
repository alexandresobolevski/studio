import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { fromPairs } from 'lodash';

import { BalanceFetcherRegistry } from './balance-fetcher.registry';
import { GetBalancesQuery } from './dto/get-balances-query.dto';

@Injectable()
export class BalanceService {
  private logger = new Logger(BalanceService.name);

  constructor(@Inject(BalanceFetcherRegistry) private readonly balanceFetcherRegistry: BalanceFetcherRegistry) {}

  async getBalances({ appId, addresses, network }: GetBalancesQuery & { appId: string }) {
    try {
      const fetcher = this.balanceFetcherRegistry.get(appId, network);
      const balances = await Promise.all(
        addresses.map(async address =>
          fetcher
            .getBalances(address)
            .then(balance => [address, balance])
            .catch(e => {
              this.logger.error(`Failed to fetch balance for ${appId} on network ${network}: ${e.stack}`);
              return [address, { error: e.message }];
            }),
        ),
      );

      return fromPairs(balances);
    } catch (e) {
      throw new NotFoundException(e.message);
    }
  }
}
