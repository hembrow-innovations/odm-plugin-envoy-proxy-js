import { join } from "node:path";
import { YamlTools, FsTools } from "../utils";
import { Cluster, EnvoyConfig, Route, ServiceConfg } from "../config-types";

/**
 * The ConfigDiscover class is responsible for discovering and collecting
 * service configurations (clusters and routes) from a set of predefined folders.
 * It searches for specific configuration subfolders and parses YAML files
 * within them.
 *
 * @export
 * @class ConfigDiscover
 */
export class ConfigDiscover {
  /**
   * An array of base folder paths to search for service configurations.
   * @private
   * @type {string[]}
   */
  private folderPaths: string[];
  /**
   * Path to the base/template envoy config yaml file.
   * @private
   * @type {string}
   */
  private baseConfigPath: string;

  /**
   * The name of the subfolder that contains the Envoy configuration files.
   * Defaults to "envoy".
   * @private
   * @type {string}
   */
  private configFolderName: string;

  /**
   * Creates an instance of ConfigDiscover.
   * @param {string[]} folderPaths - An array of paths to the top-level service folders.
   * @param {string} baseConfigPath - Path to the base/template envoy config yaml file.
   * @param {string} [configFolderName="envoy"] - The name of the configuration subfolder.
   */
  constructor(
    folderPaths: string[],
    baseConfigPath: string,
    configFolderName: string = "envoy"
  ) {
    this.folderPaths = folderPaths;
    this.baseConfigPath = baseConfigPath;
    this.configFolderName = configFolderName;
  }

  /**
   * Reads a YAML file and parses its contents as an array of Route objects.
   *
   * @private
   * @param {string} filePath - The path to the YAML file.
   * @returns {Route[]} An array of Route objects, or an empty array if the file is invalid or routes are not found.
   */
  private readRouteYaml(filePath: string): Route[] {
    const routeFile = YamlTools.read_yaml(filePath);
    if (routeFile) {
      const routes = routeFile as { routes: Route[] };
      if (routes.routes && Array.isArray(routes.routes)) {
        return routes.routes as Route[];
      }
    }
    return [];
  }

  /**
   * Retrieves all route configurations from a specified folder by reading and parsing
   * all YAML files within it.
   *
   * @private
   * @param {string} folderPath - The path to the folder containing route YAML files.
   * @returns {Route[]} An array of all routes found in the folder.
   */
  private getRoutes(folderPath: string): Route[] {
    const newRoutes: Route[] = [];
    const contents = FsTools.listDirContents(folderPath);
    if (contents) {
      for (const f of contents.files) {
        if (f.includes(".yaml")) {
          const fileRoutes = this.readRouteYaml(join(folderPath, f));
          newRoutes.push(...fileRoutes); // Correctly concatenating arrays
        }
      }
    }
    return newRoutes;
  }

  /**
   * Reads a YAML file and parses its contents as an array of Cluster objects.
   *
   * @private
   * @param {string} filePath - The path to the YAML file.
   * @returns {Cluster[]} An array of Cluster objects, or an empty array if the file is invalid or clusters are not found.
   */
  private readClusterYaml(filePath: string): Cluster[] {
    const clusterFile = YamlTools.read_yaml(filePath);
    if (clusterFile) {
      const clusters = clusterFile as { clusters: Cluster[] };
      if (clusters.clusters && Array.isArray(clusters.clusters)) {
        return clusters.clusters as Cluster[];
      }
    }
    return [];
  }

  /**
   * Retrieves all cluster configurations from a specified folder by reading and parsing
   * all YAML files within it.
   *
   * @private
   * @param {string} folderPath - The path to the folder containing cluster YAML files.
   * @returns {Cluster[]} An array of all clusters found in the folder.
   */
  private getClusters(folderPath: string): Cluster[] {
    const newCluster: Cluster[] = [];
    const contents = FsTools.listDirContents(folderPath);
    if (contents) {
      for (const f of contents.files) {
        if (f.includes(".yaml")) {
          const fileClusters = this.readClusterYaml(join(folderPath, f));
          newCluster.push(...fileClusters); // Correctly concatenating arrays
        }
      }
    }
    return newCluster;
  }

  /**
   * Finds and collects the full `ServiceConfg` for a single folder path.
   * It looks for the configured `configFolderName` subfolder and then
   * recursively calls other methods to get routes and clusters.
   *
   * @private
   * @param {string} folderPath - The path to the top-level service folder.
   * @returns {(ServiceConfg | null)} The service configuration object, or null if no configuration is found.
   */
  private findServiceConfigs(folderPath: string): ServiceConfg | null {
    const configs: ServiceConfg = { routes: [], clusters: [] };
    const contents = FsTools.listDirContents(folderPath);
    if (contents) {
      const configFolder = contents.folders.find(
        (f) => f === this.configFolderName
      );
      if (configFolder) {
        const configPath = join(folderPath, configFolder);
        configs.routes = configs.routes.concat(
          this.getRoutes(join(configPath, "routes"))
        );
        configs.clusters = configs.clusters.concat(
          this.getClusters(join(configPath, "clusters"))
        );

        // Check if any configurations were actually found
        if (configs.routes.length > 0 || configs.clusters.length > 0) {
          return configs;
        }
      }
    }
    return null;
  }

  /**
   * Collects all service configurations by iterating through the configured folder paths.
   * This is the main public method to trigger the discovery process.
   *
   * @public
   * @returns {ServiceConfg[]} An array of all discovered service configurations.
   */
  public collect(): ServiceConfg[] {
    const services: ServiceConfg[] = [];

    for (const fp of this.folderPaths) {
      const service = this.findServiceConfigs(fp);
      if (service) services.push(service);
    }

    return services;
  }

  /**
   * Get the base yaml configuration
   *
   * @public
   * @returns {EnvoyConfig} an envoy configuration base/template
   */
  public collectBase(): EnvoyConfig {
    const baseConfig = YamlTools.read_yaml(this.baseConfigPath);
    if (!baseConfig)
      throw Error("base envoy config not found at " + this.baseConfigPath);
    return baseConfig as EnvoyConfig;
  }
}
