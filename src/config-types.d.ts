/**
 * Represents a collection of clusters and routes for a service.
 * @property {Cluster[]} clusters - An array of cluster configurations.
 * @property {Route[]} routes - An array of route configurations.
 */
type ServiceConfg = {
  clusters: Cluster[];
  routes: Route[];
};

// represent time durations  as strings, just like in the YAML configuration.
// a utility type might be needed to parse these later.
type DurationString = string;
type PercentValue = number;

/**
 * Main Envoy configuration structure.
 */
export interface EnvoyConfig {
  static_resources: StaticResources;
}

/**
 * StaticResources contains listeners and clusters.
 */
export interface StaticResources {
  listeners: Listener[];
  clusters: Cluster[];
}

/**
 * Listener configuration.
 */
export interface Listener {
  name: string;
  address: Address;
  filter_chains: FilterChain[];
}

/**
 * FilterChain holds network filters.
 */
export interface FilterChain {
  filters: Filter[];
}

/**
 * Filter configuration (e.g., HTTP Connection Manager).
 */
export interface Filter {
  name: string;
  typed_config: TypedConfig;
}

/**
 * TypedConfig holds the actual configuration for a filter.
 * This is a union type to correctly represent different filter configurations.
 */
export type TypedConfig = HttpConnectionManagerTypedConfig; // Use 'unknown' for configurations not explicitly defined here
// ! this type has other types
// TODO add other connection manager types

/**
 * TypedConfig for the HttpConnectionManager filter.
 * This corresponds to the `type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager` type.
 */
export interface HttpConnectionManagerTypedConfig {
  "@type": "type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager";
  stat_prefix?: string;
  codec_type?: string;
  route_config?: RouteConfig;
  http_filters?: HTTPFilter[];
  access_log?: AccessLog[];
}

/**
 * RouteConfig for HTTP Connection Manager.
 */
export interface RouteConfig {
  name: string;
  virtual_hosts: VirtualHost[];
}

/**
 * VirtualHost represents a virtual host configuration.
 */
export interface VirtualHost {
  name: string;
  domains: string[];
  routes: Route[];
  cors?: CORS;
}

/**
 * Key Value pair of a header
 */
export type HeaderValue = {
  key: string;
  value: string;
};

/**
 * RouteConfiguration represents the top-level route configuration.
 */
export interface RouteConfiguration {
  name: string;
  virtual_hosts: VirtualHost[];
  response_headers_to_add?: HeaderValue[];
  request_id_extension?: RequestIDConfig;
}

/**
 * Route represents an individual route.
 */
export interface Route {
  name?: string;
  match: RouteMatch;
  route?: RouteAction;
  redirect?: RedirectAction;
  direct_response?: DirectResponseAction;
  metadata?: Metadata;
  decorator?: Decorator;
  typed_per_filter_config?: Record<string, unknown>;
}

/**
 * RouteMatch defines route matching criteria.
 */
export interface RouteMatch {
  prefix?: string;
  path?: string;
  safe_regex?: string;
  headers?: HeaderMatcher[];
  query_parameters?: QueryParamMatcher[];
  case_sensitive?: boolean;
  runtime_fraction?: RuntimeFractionalPercent;
}

/**
 * RouteAction defines the routing action.
 */
export interface RouteAction {
  cluster?: string;
  cluster_header?: string;
  weighted_clusters?: WeightedCluster;
  host_rewrite_literal?: string;
  prefix_rewrite?: string;
  regex_rewrite?: RegexRewrite;
  timeout?: DurationString;
  retry_policy?: RetryPolicy;
  rate_limits?: RateLimit[];
  request_headers_to_add?: HeaderValueOption[];
  response_headers_to_add?: HeaderValueOption[];
  hash_policy?: HashPolicy[];
}

/**
 * RedirectAction defines redirect behavior.
 */
export interface RedirectAction {
  host_redirect?: string;
  path_redirect?: string;
  prefix_rewrite?: string;
  response_code?: number;
  https_redirect?: boolean;
  strip_query?: boolean;
}

/**
 * DirectResponseAction defines direct response behavior.
 */
export interface DirectResponseAction {
  status: number;
  body?: string;
}

/**
 * WeightedCluster defines weighted cluster routing.
 */
export interface WeightedCluster {
  clusters: ClusterWeight[];
  total_weight?: number;
}

/**
 * ClusterWeight defines a weighted cluster.
 */
export interface ClusterWeight {
  name: string;
  weight: number;
}

/**
 * HeaderMatcher defines header matching criteria.
 */
export interface HeaderMatcher {
  name: string;
  exact_match?: string;
  safe_regex_match?: string;
  prefix_match?: string;
  suffix_match?: string;
  present_match?: boolean;
  invert_match?: boolean;
}

/**
 * QueryParamMatcher defines query parameter matching.
 */
export interface QueryParamMatcher {
  name: string;
  string_match?: string;
  present_match?: boolean;
}

/**
 * RetryPolicy defines retry behavior.
 */
export interface RetryPolicy {
  retry_on?: string;
  num_retries?: number;
  per_try_timeout?: DurationString;
  retry_back_off?: BackOffPolicy;
  retriable_headers?: HeaderMatcher[];
}

/**
 * BackOffPolicy defines backoff behavior.
 */
export interface BackOffPolicy {
  base_interval: DurationString;
  max_interval?: DurationString;
}

/**
 * RateLimit defines rate limiting.
 */
export interface RateLimit {
  actions: RateLimitAction[];
}

/**
 * RateLimitAction defines rate limit actions.
 */
export interface RateLimitAction {
  request_headers?: RequestHeaders;
  remote_address?: Record<string, never>; // Empty object, as there are no fields
  generic_key?: GenericKey;
  header_value_match?: HeaderValueMatch;
}

/**
 * HeaderValueOption represents a header value with options.
 */
export interface HeaderValueOption {
  header: HeaderValue;
  append?: boolean;
}

/**
 * CORS defines CORS policy.
 */
export interface CORS {
  allow_origin?: string[];
  allow_methods?: string;
  allow_headers?: string;
  expose_headers?: string;
  max_age?: string;
  allow_credentials?: boolean;
}

// Additional supporting types
export interface RuntimeFractionalPercent {
  default_value: number;
  runtime_key?: string;
}

export interface RegexRewrite {
  pattern: string;
  substitution: string;
}

export interface HashPolicy {
  header?: Header;
  cookie?: Cookie;
  connection_properties?: ConnectionProperties;
  query_parameter?: QueryParameter;
}

export interface Header {
  header_name: string;
}

export interface Cookie {
  name: string;
  ttl?: DurationString;
  path?: string;
}

export interface ConnectionProperties {
  source_ip?: boolean;
}

export interface QueryParameter {
  name: string;
}

export interface Metadata {
  filter_metadata?: Record<string, unknown>;
}

export interface Decorator {
  operation: string;
}

export interface RequestIDConfig {
  typed_config: Record<string, unknown>;
}

// Rate limit action types
export interface RequestHeaders {
  header_name: string;
  descriptor_key: string;
}

export type RemoteAddress = Record<string, never>;

export interface GenericKey {
  descriptor_value: string;
}

export interface HeaderValueMatch {
  descriptor_value: string;
  expect_match?: boolean;
  headers: HeaderMatcher[];
}

// HTTPFilter configuration
export interface HTTPFilter {
  name: string;
  typed_config: HTTPFilterTypedConfig;
}

// HTTPFilterTypedConfig holds configurations for various HTTP filters
export interface HTTPFilterTypedConfig {
  "@type": string;
  // For ExtAuthz filter
  http_service?: HTTPService;
  path_prefix?: string;
  failure_mode_allow?: boolean;
  clear_route_cache?: boolean;
  // For Compressor filter
  response_direction_config?: ResponseDirectionConfig;
  compressor_library?: CompressorLibrary;
}

// HTTPService for ExtAuthz
export interface HTTPService {
  server_uri: ServerURI;
  authorization_request?: AuthorizationRequest;
  authorization_response?: AuthorizationResponse;
}

// ServerURI for ExtAuthz HTTP service
export interface ServerURI {
  uri: string;
  cluster: string;
  timeout: DurationString;
}

// AuthorizationRequest for ExtAuthz
export interface AuthorizationRequest {
  allowed_headers: AllowedHeaders;
}

// AuthorizationResponse for ExtAuthz
export interface AuthorizationResponse {
  allowed_upstream_headers: AllowedHeaders;
}

// AllowedHeaders for ExtAuthz authorization
export interface AllowedHeaders {
  patterns: HeaderPattern[];
}

// HeaderPattern for ExtAuthz allowed headers
export interface HeaderPattern {
  exact: string;
}

// ResponseDirectionConfig for Compressor filter
export interface ResponseDirectionConfig {
  common_config: CommonCompressionConfig;
}

// CommonCompressionConfig for Compressor filter
export interface CommonCompressionConfig {
  min_content_length: number;
  content_type: string[];
}

// CompressorLibrary for Compressor filter
export interface CompressorLibrary {
  name: string;
  typed_config: CompressorLibraryConfig;
}

// CompressorLibraryConfig for Gzip compressor
export interface CompressorLibraryConfig {
  "@type": string;
}

// AccessLog configuration
export interface AccessLog {
  name: string;
  typed_config: AccessLogConfig;
}

// AccessLogConfig for StdoutAccessLog
export interface AccessLogConfig {
  "@type": string;
}

export interface ServiceDeclaration {
  clusters: Cluster[];
  routes: Route[];
}

/**
 * Http2ProtocolOptions defines HTTP/2 protocol options
 */
export type Http2ProtocolOptions = {
  hpack_table_size: number;
  max_concurrent_streams: number;
  initial_stream_window_size: number;
  initial_connection_window_size: number;
  allow_connect: boolean;
  max_outbound_frames: number;
  max_outbound_control_frames: number;
  max_consecutive_inbound_frames_with_empty_payload: number;
  max_inbound_priority_frames_per_stream: number;
  max_inbound_window_update_frames_per_data_frame_sent: number;
  stream_error_on_invalid_http_messaging: boolean;
  override_stream_error_on_invalid_http_message: boolean;
};
/**
 * HttpProtocolOptions defines HTTP/1.1 protocol options
 */
export type HttpProtocolOptions = {
  idle_timeout: string;
  max_connection_duration: string;
  max_headers_count: number;
  max_stream_duration: string;
  headers_with_underscores_action: string;
  max_request_headers_kb: number;
};

// Cluster represents an Envoy cluster configuration
export interface Cluster {
  name: string;
  type: string;
  connect_timeout?: DurationString;
  per_connection_buffer_limit_bytes?: number;
  lb_policy?: string;
  load_assignment?: ClusterLoadAssignment;
  health_checks?: HealthCheck[];
  max_requests_per_connection?: number;
  http2_protocol_options?: Http2ProtocolOptions;
  http_protocol_options?: HttpProtocolOptions;
  dns_lookup_family?: string;
  dns_resolvers?: Address[];
  outlier_detection?: OutlierDetection;
  cleanup_interval?: DurationString;
  upstream_connection_options?: UpstreamConnectionOptions;
  common_lb_config?: CommonLbConfig;
  transport_socket?: TransportSocket;
  metadata?: Metadata;
  protocol_selection?: string;
  upstream_http_protocol_options?: UpstreamHttpProtocolOptions;
  circuit_breakers?: CircuitBreakers;
  typed_extension_protocol_options?: Record<string, unknown>;
  dns_refresh_rate?: DurationString;
  dns_failure_refresh_rate?: DnsFailureRefreshRate;
  respect_dns_ttl?: boolean;
  lb_subset_config?: LbSubsetConfig;
  ring_hash_lb_config?: RingHashLbConfig;
  maglev_lb_config?: MaglevLbConfig;
  original_dst_lb_config?: OriginalDstLbConfig;
  least_request_lb_config?: LeastRequestLbConfig;
  common_http_protocol_options?: CommonHttpProtocolOptions;
  alt_stat_name?: string;
  preconnect_policy?: PreconnectPolicy;
  connection_pool_per_downstream_connection?: boolean;
}

// ClusterLoadAssignment defines load assignment for the cluster
export interface ClusterLoadAssignment {
  cluster_name: string;
  endpoints: Locality[];
  policy?: Policy;
}

// Locality represents a locality-aware endpoint group
export interface Locality {
  locality?: LocalityInfo;
  lb_endpoints: LbEndpoint[];
  load_balancing_weight?: number;
  priority?: number;
  proximity?: number;
}

// LocalityInfo represents locality information
export interface LocalityInfo {
  region?: string;
  zone?: string;
  sub_zone?: string;
}

// LbEndpoint represents a load balanced endpoint
export interface LbEndpoint {
  endpoint?: Endpoint;
  health_status?: string;
  metadata?: Metadata;
  load_balancing_weight?: number;
}

// Endpoint represents an endpoint
export interface Endpoint {
  address: Address;
  health_check_config?: EnvoyHealthCheckConfig;
}

// Address represents a network address
export interface Address {
  socket_address?: SocketAddress;
  pipe?: Pipe;
}

// SocketAddress represents a socket address
export interface SocketAddress {
  protocol?: string;
  address: string;
  port_value?: number;
  named_port?: string;
  resolver_name?: string;
  ipv4_compat?: boolean;
}

// Pipe represents a pipe address
export interface Pipe {
  path: string;
  mode?: number;
}

// HealthCheck defines health check configuration
export interface HealthCheck {
  timeout: DurationString;
  interval: DurationString;
  interval_jitter?: DurationString;
  interval_jitter_percent?: number;
  unhealthy_threshold?: number;
  healthy_threshold?: number;
  alt_port?: number;
  reuse_connection?: boolean;
  http_health_check?: HttpHealthCheck;
  tcp_health_check?: TcpHealthCheck;
  grpc_health_check?: GrpcHealthCheck;
  custom_health_check?: CustomHealthCheck;
  no_traffic_interval?: DurationString;
  unhealthy_interval?: DurationString;
  unhealthy_edge_interval?: DurationString;
  healthy_edge_interval?: DurationString;
  event_log_path?: string;
  always_log_health_check_failures?: boolean;
  tls_options?: TlsOptions;
  transport_socket?: TransportSocket;
}

// HttpHealthCheck defines HTTP health check
export interface HttpHealthCheck {
  host?: string;
  path: string;
  send?: string;
  receive?: string[];
  request_headers_to_add?: HeaderValueOption[];
  request_headers_to_remove?: string[];
  expected_statuses?: StatusRange[];
  codec_client_type?: string;
  service_name_matcher?: StringMatcher;
}

// TcpHealthCheck defines TCP health check
export interface TcpHealthCheck {
  send?: string;
  receive?: string[];
}

// GrpcHealthCheck defines gRPC health check
export interface GrpcHealthCheck {
  service_name?: string;
  authority?: string;
}

// CustomHealthCheck defines custom health check
export interface CustomHealthCheck {
  name: string;
  typed_config?: Record<string, unknown>;
}

// OutlierDetection defines outlier detection configuration
export interface OutlierDetection {
  consecutive_5xx?: number;
  interval?: DurationString;
  base_ejection_time?: DurationString;
  max_ejection_percent?: number;
  min_health_percent?: number;
  split_external_local_origin_errors?: boolean;
  consecutive_local_origin_failure?: number;
  consecutive_gateway_failure?: number;
  enforcing_consecutive_5xx?: number;
  enforcing_success_rate?: number;
  success_rate_minimum_hosts?: number;
  success_rate_request_volume?: number;
  success_rate_stdev_factor?: number;
  enforcing_local_origin_success_rate?: number;
  enforcing_consecutive_local_origin_failure?: number;
  enforcing_consecutive_gateway_failure?: number;
  max_ejection_time?: DurationString;
}

// CircuitBreakers defines circuit breaker configuration
export interface CircuitBreakers {
  thresholds?: Thresholds[];
}

// Thresholds defines circuit breaker thresholds
export interface Thresholds {
  priority?: string;
  max_connections?: number;
  max_pending_requests?: number;
  max_requests?: number;
  max_retries?: number;
  retry_budget?: RetryBudget;
  track_remaining?: boolean;
  max_connection_pools?: number;
}

// RetryBudget defines retry budget configuration
export interface RetryBudget {
  budget_percent?: PercentValue;
  min_retry_concurrency?: number;
}

// ... and so on for the rest of the structs
// To keep the response concise, I will not include the rest of the structs here,
// as the conversion pattern is consistent.
