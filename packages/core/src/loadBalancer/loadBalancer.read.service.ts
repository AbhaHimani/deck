import type { IQService } from 'angular';
import { module } from 'angular';

import { REST } from '../api/ApiService';
import type { ILoadBalancer, ILoadBalancerSourceData } from '../domain';
import { CORE_LOADBALANCER_LOADBALANCER_TRANSFORMER } from './loadBalancer.transformer';
import type { IComponentName } from '../naming';
import { NameUtils } from '../naming';

export interface ILoadBalancersByAccount {
  name: string;
  accounts: Array<{
    name: string;
    regions: Array<{
      name: string;
      loadBalancers: ILoadBalancerSourceData[];
    }>;
  }>;
}

export class LoadBalancerReader {
  public static $inject = ['$q', 'loadBalancerTransformer'];
  public constructor(private $q: IQService, private loadBalancerTransformer: any) {}

  public loadLoadBalancers(applicationName: string, activeState:object): PromiseLike<ILoadBalancerSourceData[]> {
    if((window.location.href==="executions" || window.location.href==="search") && activeState==null){
      return Promise.resolve([]);
    }
    
    return REST('/applications')
      .path(applicationName, 'loadBalancers')
      .get()
      .then((loadBalancers: ILoadBalancerSourceData[]) => {
        loadBalancers = this.loadBalancerTransformer.normalizeLoadBalancerSet(loadBalancers);
        return this.$q.all(loadBalancers.map((lb) => this.normalizeLoadBalancer(lb)));
      });
  }

  public getLoadBalancerDetails(
    cloudProvider: string,
    account: string,
    region: string,
    name: string,
  ): PromiseLike<ILoadBalancerSourceData[]> {
    return REST('/loadBalancers').path(account, region, name).query({ provider: cloudProvider }).get();
  }

  public listLoadBalancers(cloudProvider: string): PromiseLike<ILoadBalancersByAccount[]> {
    return REST('/loadBalancers').query({ provider: cloudProvider }).get();
  }

  private normalizeLoadBalancer(loadBalancer: ILoadBalancerSourceData): PromiseLike<ILoadBalancer> {
    return this.loadBalancerTransformer.normalizeLoadBalancer(loadBalancer).then((lb: ILoadBalancer) => {
      const nameParts: IComponentName = NameUtils.parseLoadBalancerName(lb.name);
      lb.stack = nameParts.stack;
      lb.detail = nameParts.freeFormDetails;
      lb.cloudProvider = lb.cloudProvider || lb.type || lb.provider;
      return lb;
    });
  }
}

export const LOAD_BALANCER_READ_SERVICE = 'spinnaker.core.loadBalancer.read.service';

module(LOAD_BALANCER_READ_SERVICE, [CORE_LOADBALANCER_LOADBALANCER_TRANSFORMER]).service(
  'loadBalancerReader',
  LoadBalancerReader,
);
