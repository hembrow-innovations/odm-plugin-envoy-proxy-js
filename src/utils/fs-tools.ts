import * as fs from "node:fs";
import * as path from "node:path";

/**
 * A utility class for performing common file system operations.
 * All methods are static and provide robust error handling for various
 * file system-related issues.
 *
 * @export
 * @class FsTools
 */
export class FsTools {
  /**
   * Checks for a specific configuration folder structure within a given base path.
   * It looks for a "config/api-gateway" subfolder.
   *
   * @static
   * @param {string} basePath - The starting path to search from.
   * @returns {[boolean, string]} A tuple where the first element is a boolean indicating success,
   * and the second is the full path if found, or an error message if not.
   */
  public static getConfigFolder(basePath: string): [boolean, string] {
    try {
      const contents = fs.readdirSync(basePath);
      if (contents.includes("config")) {
        const newPath = path.join(basePath, "config", "api-gateway");
        if (fs.existsSync(newPath) && fs.lstatSync(newPath).isDirectory()) {
          return [true, newPath];
        }
      }
    } catch (error) {
      // Handle potential errors like EACCES for readdirSync
      console.error(`Error checking config folder: ${error}`);
    }
    return [false, "Correct Folder not Found!"];
  }

  /**
   * Checks if a given path exists and is a directory.
   *
   * @static
   * @param {string} folderPath - The path to check.
   * @returns {boolean} `true` if the path exists and is a directory, otherwise `false`.
   */
  public static checkFolderExists(folderPath: string): boolean {
    const exists =
      fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory();
    return exists;
  }

  /**
   * Lists the contents of a directory, separating them into files and folders.
   * This method uses `lstatSync` to handle symbolic links correctly and
   * includes error handling for common issues like `ENOENT` (file not found)
   * and `EACCES` (permission denied).
   *
   * @static
   * @param {string} dirPath - The path to the directory to list.
   * @returns {({ folders: string[]; files: string[] } | null)} An object containing two arrays,
   * one for folders and one for files, or `null` if an error occurred.
   */
  public static listDirContents(
    dirPath: string
  ): { folders: string[]; files: string[] } | null {
    try {
      const contents = fs.readdirSync(dirPath);
      const sortedContents: { folders: string[]; files: string[] } = {
        folders: [],
        files: [],
      };
      for (const item of contents) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.lstatSync(fullPath);
        if (stats.isFile()) {
          sortedContents.files.push(item);
        } else if (stats.isDirectory()) {
          sortedContents.folders.push(item);
        }
      }
      return sortedContents;
    } catch (error) {
      console.error(`Error: '${error}'`);

      return null;
    }
  }

  /**
   * Creates a folder at the specified path.
   * It is recursive, meaning it will create any necessary parent directories.
   *
   * @static
   * @param {string} folderPath - The path of the folder to create.
   * @returns {[string, boolean]} A tuple where the first element is a status message, and the second is a boolean indicating if an error occurred (`true` for error, `false` for success).
   */
  public static createFolder(folderPath: string): [string, boolean] {
    try {
      fs.mkdirSync(folderPath, { recursive: true });
      return [`Created: ${folderPath}`, false];
    } catch (e) {
      return [`Error creating filesystem structure: ${e}`, true];
    }
  }
}
