import type { IQService } from 'angular';
import { module } from 'angular';

import type { Application } from '../application/application.model';
import { INFRASTRUCTURE_KEY } from '../application/nav/defaultCategories';
import { ApplicationDataSourceRegistry } from '../application/service/ApplicationDataSourceRegistry';
import type { ILoadBalancer } from '../domain';
import { EntityTagsReader } from '../entityTag/EntityTagsReader';
import type { LoadBalancerReader } from './loadBalancer.read.service';
import { LOAD_BALANCER_READ_SERVICE } from './loadBalancer.read.service';
import { addManagedResourceMetadataToLoadBalancers } from '../managed';

export const LOAD_BALANCER_DATA_SOURCE = 'spinnaker.core.loadBalancer.dataSource';
module(LOAD_BALANCER_DATA_SOURCE, [LOAD_BALANCER_READ_SERVICE]).run([
  '$q',
  'loadBalancerReader',
  ($q: IQService, loadBalancerReader: LoadBalancerReader) => {
    const loadLoadBalancers = (application: Application) => {
      return loadBalancerReader.loadLoadBalancers(application.name,application.activeState);
    };

    const addLoadBalancers = (_application: Application, loadBalancers: ILoadBalancer[]) => {
      return $q.when(loadBalancers);
    };

    const addTags = (application: Application) => {
      EntityTagsReader.addTagsToLoadBalancers(application);
      addManagedResourceMetadataToLoadBalancers(application);
    };

    ApplicationDataSourceRegistry.registerDataSource({
      key: 'loadBalancers',
      sref: '.insight.loadBalancers',
      category: INFRASTRUCTURE_KEY,
      optional: true,
      icon: 'fa fa-xs fa-fw icon-sitemap',
      iconName: 'spMenuLoadBalancers',
      loader: loadLoadBalancers,
      onLoad: addLoadBalancers,
      afterLoad: addTags,
      providerField: 'cloudProvider',
      credentialsField: 'account',
      regionField: 'region',
      description: 'Traffic distribution management between servers',
      defaultData: [],
    });
  },
]);
