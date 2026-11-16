'use strict';

// Reuse deterministic BFF integration contracts as coverage drivers. These
// tests use fake PostgREST/provider adapters and local-only HTTP servers; they
// never call a real Supabase or billing service.
require('../tests/test_bff_implementation.js');
require('./coverage-bff-modules.js');
require('../tests/test_admin_store_postgrest_contract.js');
require('../tests/test_admin_routes_contract.js');
require('../tests/test_p3_account_lifecycle.js');
require('../tests/test_p4_chariow_billing.js');
require('../tests/test_serverless_webhook_handler.js');
require('../tests/test_billing_store.js');
require('../tests/test_progress_sync.js');
require('../tests/test_supabase_auth_adapter.js');
