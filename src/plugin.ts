import {
  PluginExecuter,
  ExecutionRequestBody,
  ExecutionResponse,
} from "@hembrow-innovations/odm-plugin-js";
import { Compiler, ConfigDiscover } from "./config-compiler";
import { YamlTools } from "./utils";

/**
 * Defines the possible actions for the plugin.
 */
type PluginActions = "merge";

/**
 * Defines the options that can be passed to the plugin for execution.
 * @property {PluginActions} action - The action to be performed by the plugin.
 * @property {string[]} items - An array of paths to the service configuration folders.
 * @property {string} rootPath - The root path for the discovery process.
 * @property {string} output - The file path where the compiled Envoy configuration will be written.
 * @property {string} base - The path to the base Envoy configuration file.
 * @property {string} folderName - The name of the configuration subfolder to look for within service folders.
 */
type Options = {
  action: PluginActions;
  items: string[];
  rootPath: string;
  output: string;
  base: string;
  folderName: string;
};

/**
 * The EnvoyProxyPlugin is a plugin for the odm-plugin-js framework.
 * It is responsible for discovering, compiling, and merging Envoy proxy configurations
 * from multiple services into a single output file.
 *
 * @class EnvoyProxyPlugin
 * @implements {PluginExecuter}
 */
class EnvoyProxyPlugin implements PluginExecuter {
  /**
   * Executes the main logic of the plugin. It receives a request body, processes
   * the options, discovers service configurations, compiles them with a base
   * configuration, and writes the final output.
   *
   * @async
   * @param {ExecutionRequestBody} request - The request body containing the plugin options.
   * @returns {Promise<ExecutionResponse>} A promise that resolves to an `ExecutionResponse` object.
   * The result field will contain the compiled configuration as a JSON string or an error message.
   */
  async execute(request: ExecutionRequestBody): Promise<ExecutionResponse> {
    try {
      console.log("Envoy Proxy Plugin: Processing request...");

      // Extract and process options
      const options: Options = {
        action: "merge",
        items: [],
        rootPath: "",
        output: "",
        base: "",
        folderName: "envoy",
      };

      for (const [key, value] of Object.entries(request.options || {})) {
        if (typeof key === "string" && typeof value === "string") {
          if (key === "root-path") options.rootPath = value;
          if (key === "base") options.base = value;
          if (key === "output") options.output = value;
          if (key === "folder-name") options.folderName = value;
        }
        if (key === "items" && Array.isArray(value))
          options.items = value as string[];
      }

      // Initialize ConfigDiscover to find service configurations
      const discovery = new ConfigDiscover(
        options.items,
        options.base,
        options.folderName
      );

      // Collect service-specific configurations
      const services = discovery.collect();

      // Collect the base Envoy configuration
      const baseConfig = discovery.collectBase();

      // Initialize the Compiler to merge configurations
      const compiler = new Compiler(baseConfig, services);

      // Build the final, compiled configuration
      compiler.build();
      const compiledConfig = compiler.getStore();
      if (!compiledConfig)
        throw new Error("envoy proxy configuration compilation failed");

      // Write the compiled configuration to a file if it exists
      if (compiledConfig) YamlTools.write_yaml(compiledConfig, options.output);

      return {
        result: JSON.stringify(compiledConfig),
      };
    } catch (error) {
      console.error("Plugin execution error:", error);
      return {
        result: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}

export { EnvoyProxyPlugin };
