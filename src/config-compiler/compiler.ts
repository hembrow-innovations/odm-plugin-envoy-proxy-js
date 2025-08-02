import { EnvoyConfig, Route, ServiceConfg } from "../config-types";

/**
 * The Compiler class is responsible for merging service configurations into a
 * base Envoy configuration. It handles the addition and merging of clusters and routes.
 *
 * @export
 * @class Compiler
 */
export class Compiler {
  /**
   * An array of service configurations to be merged.
   * @private
   * @type {ServiceConfg[]}
   */
  private serviceConfigs: ServiceConfg[];

  /**
   * The base Envoy configuration, which is updated with service configs.
   * @private
   * @type {(EnvoyConfig | null)}
   */
  private store: EnvoyConfig | null = null;

  /**
   * Creates an instance of Compiler.
   * @param {EnvoyConfig} configBase - The base Envoy configuration to start with.
   * @param {ServiceConfg[]} serviceConfigs - An array of service-specific configurations to be merged.
   */
  constructor(configBase: EnvoyConfig, serviceConfigs: ServiceConfg[]) {
    console.log("Initializing compiler");
    this.store = configBase;
    this.serviceConfigs = serviceConfigs;
  }

  /**
   * Safely retrieves the routes from the first virtual host of the first listener in the configuration.
   * It performs extensive null-checking to prevent runtime errors.
   *
   * @private
   * @param {EnvoyConfig} config - The Envoy configuration to extract routes from.
   * @returns {Route[]} A new array of routes, or an empty array if the path does not exist.
   */
  private getRouteArray(config: EnvoyConfig): Route[] {
    const listeners = config.static_resources.listeners;
    if (
      listeners &&
      listeners.length > 0 &&
      listeners[0].filter_chains &&
      listeners[0].filter_chains.length > 0 &&
      listeners[0].filter_chains[0].filters &&
      listeners[0].filter_chains[0].filters.length > 0 &&
      listeners[0].filter_chains[0].filters[0].typed_config &&
      listeners[0].filter_chains[0].filters[0].typed_config.route_config &&
      listeners[0].filter_chains[0].filters[0].typed_config.route_config
        .virtual_hosts &&
      listeners[0].filter_chains[0].filters[0].typed_config.route_config
        .virtual_hosts.length > 0
    ) {
      // Returns a new array to prevent modifying the original object by reference.
      return [
        ...listeners[0].filter_chains[0].filters[0].typed_config.route_config
          .virtual_hosts[0].routes,
      ];
    } else {
      return [];
    }
  }

  /**
   * Adds new routes to the existing route array of the first virtual host.
   * This method returns a new EnvoyConfig object to ensure immutability.
   *
   * @private
   * @param {EnvoyConfig} config - The base Envoy configuration.
   * @param {Route[]} routes - An array of new routes to add.
   * @returns {EnvoyConfig} A new EnvoyConfig object with the added routes.
   */
  private addRoute(config: EnvoyConfig, routes: Route[]): EnvoyConfig {
    const listeners = { ...config.static_resources.listeners };
    if (
      listeners &&
      listeners.length > 0 &&
      listeners[0].filter_chains &&
      listeners[0].filter_chains.length > 0 &&
      listeners[0].filter_chains[0].filters &&
      listeners[0].filter_chains[0].filters.length > 0 &&
      listeners[0].filter_chains[0].filters[0].typed_config &&
      listeners[0].filter_chains[0].filters[0].typed_config.route_config &&
      listeners[0].filter_chains[0].filters[0].typed_config.route_config
        .virtual_hosts &&
      listeners[0].filter_chains[0].filters[0].typed_config.route_config
        .virtual_hosts.length > 0
    ) {
      listeners[0].filter_chains[0].filters[0].typed_config.route_config.virtual_hosts[0].routes =
        [
          ...listeners[0].filter_chains[0].filters[0].typed_config.route_config
            .virtual_hosts[0].routes,
          ...routes,
        ];
      return {
        ...config,
        static_resources: {
          ...config.static_resources,
          listeners: listeners,
        },
      };
    } else {
      return { ...config };
    }
  }

  /**
   * Merges a single service configuration into the base Envoy configuration.
   * It handles merging clusters by name (updating existing ones or adding new ones)
   * and appends new routes.
   *
   * @private
   * @param {EnvoyConfig} base - The base configuration.
   * @param {ServiceConfg} service - The service configuration to merge.
   * @returns {EnvoyConfig} A new EnvoyConfig object with the merged data.
   */
  private mergeConfig(base: EnvoyConfig, service: ServiceConfg): EnvoyConfig {
    let envoyConfig: EnvoyConfig = { ...base };

    // Merge clusters
    for (const newCluster of service.clusters) {
      // Get index if cluster already exists
      const hasCluster = envoyConfig.static_resources.clusters.findIndex(
        (cluster) => newCluster.name === cluster.name
      );

      if (hasCluster === -1) {
        envoyConfig.static_resources.clusters.push(newCluster);
      } else {
        envoyConfig.static_resources.clusters[hasCluster] = newCluster;
      }
    }

    // Merge Routes
    const existingRoutes = this.getRouteArray(envoyConfig);

    // TODO: A more robust conflict detection/resolution mechanism should be implemented here.
    // The current approach simply appends the new routes.
    envoyConfig = this.addRoute(envoyConfig, [
      ...existingRoutes,
      ...service.routes,
    ]);

    return { ...envoyConfig };
  }

  /**
   * Builds the final Envoy configuration by iterating through all service configurations
   * and merging them into the base configuration.
   *
   * @public
   * @returns {(EnvoyConfig | null)} The final, merged Envoy configuration, or null if the initial store was null.
   */
  public build(): EnvoyConfig | null {
    for (const s of this.serviceConfigs) {
      if (!this.store) return null;
      this.store = this.mergeConfig(this.store, s);
    }

    return this.store;
  }
}
