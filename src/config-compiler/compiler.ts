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
   * Adds new routes to the existing route array of the first virtual host.
   * This method returns a new EnvoyConfig object to ensure immutability.
   *
   * @private
   * @param {Route[]} routesToAdd - An array of new routes to add.
   * @returns {void} return void
   */
  private addRoute(routesToAdd: Route[]): void {
    // Null check
    if (
      this.store &&
      this.store.static_resources.listeners.length > 0 &&
      this.store.static_resources.listeners[0].filter_chains &&
      this.store.static_resources.listeners[0].filter_chains.length > 0 &&
      this.store.static_resources.listeners[0].filter_chains[0].filters &&
      this.store.static_resources.listeners[0].filter_chains[0].filters.length >
        0 &&
      this.store.static_resources.listeners[0].filter_chains[0].filters[0]
        .typed_config &&
      this.store.static_resources.listeners[0].filter_chains[0].filters[0]
        .typed_config.route_config &&
      this.store.static_resources.listeners[0].filter_chains[0].filters[0]
        .typed_config.route_config.virtual_hosts &&
      this.store.static_resources.listeners[0].filter_chains[0].filters[0]
        .typed_config.route_config.virtual_hosts.length > 0
    ) {
      this.store.static_resources.listeners[0].filter_chains[0].filters[0].typed_config.route_config.virtual_hosts[0].routes =
        this.store.static_resources.listeners[0].filter_chains[0].filters[0].typed_config.route_config.virtual_hosts[0].routes.concat(
          routesToAdd
        );
    }
  }

  /**
   * Merges a single service configuration into the base Envoy configuration.
   * It handles merging clusters by name (updating existing ones or adding new ones)
   * and appends new routes.
   *
   * @private
   * @param {ServiceConfg} service - The service configuration to merge.
   * @returns {void} returns void
   */
  private mergeConfig(service: ServiceConfg): void {
    if (!this.store) return;
    // Merge clusters
    for (const newCluster of service.clusters) {
      // Get index if cluster already exists
      const hasCluster = this.store.static_resources.clusters.findIndex(
        (cluster) => newCluster.name === cluster.name
      );
      if (hasCluster === -1) {
        this.store.static_resources.clusters.push(newCluster);
      } else {
        this.store.static_resources.clusters[hasCluster] = newCluster;
      }
    }

    // Merge Routes
    // TODO: A more robust conflict detection/resolution mechanism should be implemented here.
    // The current approach simply appends the new routes.
    this.addRoute(service.routes);
  }

  /**
   * Builds the final Envoy configuration by iterating through all service configurations
   * and merging them into the base configuration.
   *
   * @public
   * @returns {void} return void
   */
  public build(): void {
    for (const s of this.serviceConfigs) {
      if (!this.store) return;
      this.mergeConfig(s);
    }
  }

  /**
   * Getter method to get envoy configuration
   *
   * @public
   * @returns {(EnvoyConfig | null)} return envoy configuration
   */
  public getStore(): EnvoyConfig | null {
    return this.store;
  }
}
