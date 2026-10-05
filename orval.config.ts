import { defineConfig } from "orval";

export default defineConfig({
  greenApi: {
    input: "./openapi/green-api.yaml",
    output: {
      target: "./domains/messaging/data-access/api/generated/chats.ts",
      schemas: "./domains/messaging/data-access/api/generated/models",
      namingConvention: "kebab-case",
      clean: true,
      client: "react-query",
      httpClient: "fetch",
      override: {
        mutator: {
          path: "./domains/messaging/data-access/api/green-api-fetch.ts",
          name: "greenApiFetch",
        },
        fetch: { includeHttpResponseReturnType: false },
        operations: {
          getChatHistoryApi: {
            query: {
              useQuery: true,
              useMutation: false,
              options: { staleTime: 5_000 },
            },
          },
        },
      },
    },
  },
});
