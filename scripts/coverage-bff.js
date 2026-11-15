'use strict';

// Reuse the real BFF implementation contract as a coverage driver. The
// contract boots createBff with a fake provider and exercises the public HTTP
// routes without calling external services.
require('../tests/test_bff_implementation.js');
require('./coverage-bff-modules.js');
