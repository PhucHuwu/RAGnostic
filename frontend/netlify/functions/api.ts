import serverless from "serverless-http";

import { createApiServer } from "../../server";

export const handler = serverless(createApiServer());
