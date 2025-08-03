# Envoy Proxy Plugin for ODM

[![npm version](https://badge.fury.io/js/%40hembrow-innovations%2Fodm-plugin-envoy-proxy-js.svg)](https://badge.fury.io/js/%40hembrow-innovations%2Fodm-plugin-envoy-proxy-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An ODM plugin that discovers, compiles, and merges Envoy proxy configurations from multiple services into a single unified configuration file.

## Overview

This plugin automates the process of combining Envoy configurations across microservices, making it easy to maintain a centralized proxy configuration while keeping service-specific routing and cluster definitions co-located with each service.

## Plugin Information

```json
{
  "name": "envoy-proxy-plugin",
  "version": "0.0.1",
  "language": "javascript",
  "source": "bin/plugin",
  "type": "npm",
  "package": "@hembrow-innovations/odm-plugin-envoy-proxy-js"
}
```

## Installation

The plugin is automatically installed when referenced in your ODM configuration. No manual installation required.

## Usage

### Basic Configuration

Add the plugin to your ODM configuration file:

```yaml
plugins:
  - name: envoy-proxy-plugin
    options:
      base: "./config/base-envoy.yaml"
      output: "./dist/envoy.yaml"
      folder-name: "envoy"
      items:
        - "./services/user-service"
        - "./services/order-service"
        - "./services/payment-service"
```

### Configuration Options

| Option        | Type       | Required | Description                                                | Default   |
| ------------- | ---------- | -------- | ---------------------------------------------------------- | --------- |
| `base`        | `string`   | ✅       | Path to the base Envoy configuration file                  | -         |
| `output`      | `string`   | ✅       | File path where the compiled configuration will be written | -         |
| `items`       | `string[]` | ✅       | Array of paths to service directories                      | `[]`      |
| `folder-name` | `string`   | ❌       | Name of the configuration subfolder in each service        | `"envoy"` |
| `root-path`   | `string`   | ❌       | Root path for relative path resolution                     | `""`      |

## Directory Structure

### Project Layout

```
your-project/
├── config/
│   └── base-envoy.yaml          # Base Envoy configuration
├── services/
│   ├── user-service/
│   │   ├── src/
│   │   └── envoy/               # Service-specific Envoy config
│   │       ├── routes/
│   │       │   └── user-routes.yaml
│   │       └── clusters/
│   │           └── user-clusters.yaml
│   ├── order-service/
│   │   ├── src/
│   │   └── envoy/
│   │       ├── routes/
│   │       │   └── order-routes.yaml
│   │       └── clusters/
│   │           └── order-clusters.yaml
│   └── payment-service/
│       ├── src/
│       └── envoy/
│           ├── routes/
│           │   └── payment-routes.yaml
│           └── clusters/
│               └── payment-clusters.yaml
└── dist/
    └── envoy.yaml               # Generated unified configuration
```

## Configuration Files

### Base Configuration (base-envoy.yaml)

Your base Envoy configuration should contain the core settings, listeners, and filters:

```yaml
static_resources:
  listeners:
    - name: main_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                codec_type: AUTO
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: local_service
                      domains: ["*"]
                      routes: [] # Routes will be merged here
                http_filters:
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters: [] # Clusters will be merged here
```

### Service Route Configuration

**services/user-service/envoy/routes/user-routes.yaml**

```yaml
routes:
  - match:
      prefix: "/api/users"
    route:
      cluster: "user-service-cluster"
      timeout: "30s"
  - match:
      prefix: "/api/auth"
    route:
      cluster: "user-service-cluster"
      timeout: "15s"
```

### Service Cluster Configuration

**services/user-service/envoy/clusters/user-clusters.yaml**

```yaml
clusters:
  - name: "user-service-cluster"
    type: "LOGICAL_DNS"
    connect_timeout: "5s"
    lb_policy: "ROUND_ROBIN"
    load_assignment:
      cluster_name: "user-service-cluster"
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: "user-service"
                    port_value: 3000
    health_checks:
      - timeout: "5s"
        interval: "10s"
        http_health_check:
          path: "/health"
```

## How It Works

1. **Discovery**: The plugin scans each service directory specified in `items`
2. **Collection**: Gathers all YAML files from `{service}/envoy/routes/` and `{service}/envoy/clusters/` directories
3. **Merging**:
   - Combines all routes and appends them to the first virtual host in the base configuration
   - Merges clusters by name (existing clusters are replaced, new ones are added)
4. **Output**: Writes the unified configuration to the specified output file

## Example ODM Workflow

```yaml
# odm.yaml
version: "1.0"
plugins:
  - name: envoy-proxy-plugin
    options:
      base: "./infrastructure/envoy/base.yaml"
      output: "./build/envoy.yaml"
      folder-name: "envoy"
      items:
        - "./microservices/api-gateway"
        - "./microservices/user-service"
        - "./microservices/order-service"
        - "./microservices/notification-service"

steps:
  - name: "Generate Envoy Configuration"
    plugin: envoy-proxy-plugin
  - name: "Deploy Configuration"
    command: "kubectl apply -f ./build/envoy.yaml"
```

## Advanced Usage

### Custom Folder Structure

If your services use a different folder structure, customize the `folder-name` option:

```yaml
plugins:
  - name: envoy-proxy-plugin
    options:
      base: "./config/base-envoy.yaml"
      output: "./dist/envoy.yaml"
      folder-name: "proxy-config" # Look for 'proxy-config' instead of 'envoy'
      items:
        - "./services/user-service"
```

### Multiple Route Files

You can organize routes into multiple files within each service:

```
services/user-service/envoy/routes/
├── authentication.yaml
├── user-management.yaml
└── profile-routes.yaml
```

All YAML files in the routes directory will be processed and merged.

## Output

The plugin generates a complete Envoy configuration file combining:

- Base configuration (listeners, filters, core settings)
- All service routes (merged into virtual hosts)
- All service clusters (with conflict resolution)

## Error Handling

Common issues and solutions:

- **Missing base configuration**: Ensure the `base` file path is correct and the file exists
- **Invalid YAML**: Check service configuration files for proper YAML syntax
- **Missing service directories**: The plugin skips non-existent directories without failing
- **Cluster name conflicts**: Later services override clusters with the same name

## Best Practices

1. **Consistent Naming**: Use consistent cluster naming conventions across services
2. **Health Checks**: Include health check configurations in your clusters
3. **Timeouts**: Set appropriate timeouts for different route types
4. **Route Organization**: Group related routes in separate files for better maintainability
5. **Base Configuration**: Keep your base configuration minimal and service-agnostic

## Troubleshooting

### Plugin Not Found

Ensure the plugin package is available in your environment. ODM will automatically install it from npm.

### Configuration Not Generated

Check the ODM logs for specific error messages. Common causes:

- Incorrect file paths in the `base` or `items` options
- Missing required directories or files
- YAML syntax errors in configuration files

### Routes Not Working

Verify that:

- Route paths don't conflict between services
- Cluster names in routes match cluster definitions
- Base configuration has the correct virtual host structure

## Contributing

For bug reports and feature requests, please visit the [GitHub repository](https://github.com/hembrow-innovations/odm-plugin-envoy-proxy-js).

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Part of the ODM Plugin Ecosystem by Hembrow Innovations**
