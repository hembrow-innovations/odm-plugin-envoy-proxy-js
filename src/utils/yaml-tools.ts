import * as yaml from "js-yaml";
import * as fs from "node:fs";

/**
 * A utility class for reading and writing YAML files.
 * This class provides static methods to handle common YAML operations
 * with robust error handling for file system and parsing issues.
 *
 * @export
 * @class YamlTools
 */
export class YamlTools {
  /**
   * Writes a JavaScript object to a YAML file.
   * The output YAML is formatted with a 2-space indent, no array indent,
   * and preserves the original order of keys.
   *
   * @static
   * @param {object} dataDict - The object to serialize into YAML.
   * @param {string} filePath - The path to the file where the YAML data will be written.
   * @returns {void}
   */
  public static write_yaml(dataDict: object, filePath: string): void {
    try {
      const yamlStr = yaml.dump(dataDict, {
        indent: 2,
        noArrayIndent: true,
        sortKeys: false,
      });
      fs.writeFileSync(filePath, yamlStr, "utf8");
      console.log(`Successfully wrote YAML to '${filePath}'`);
    } catch (e) {
      console.error(
        `Error writing dictionary to YAML file '${filePath}': ${e}`
      );
    }
  }

  /**
   * Reads a YAML file and parses its contents into a JavaScript object.
   * This method includes error handling for file not found errors (`ENOENT`)
   * and YAML parsing exceptions.
   *
   * @static
   * @param {string} filePath - The path to the YAML file to be read.
   * @returns {(unknown | null)} The parsed JavaScript object, or `null` if an error occurred.
   */
  public static read_yaml(filePath: string): unknown | null {
    try {
      const fileContents = fs.readFileSync(filePath, "utf8");
      const config = yaml.load(fileContents);
      return config;
    } catch (e) {
      console.error(`Error: '${e}'`);

      return null;
    }
  }
}
