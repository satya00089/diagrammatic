import { describe, expect, it } from "vitest";
import { parseExtensionSource } from "./extensionImport";

describe("database schema extension import", () => {
  it("recognizes pgAdmin ALTER TABLE foreign keys", () => {
    const result = parseExtensionSource(
      "database-schema",
      `CREATE TABLE IF NOT EXISTS public.tenants (
        id uuid NOT NULL,
        CONSTRAINT tenants_pkey PRIMARY KEY (id)
      );

      CREATE TABLE IF NOT EXISTS public.users (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        CONSTRAINT users_pkey PRIMARY KEY (id)
      );

      CREATE TABLE IF NOT EXISTS public.api_credentials (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        user_id uuid,
        CONSTRAINT api_credentials_pkey PRIMARY KEY (id)
      );

      ALTER TABLE IF EXISTS public.users
        ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id)
        REFERENCES public.tenants (id) MATCH SIMPLE;

      ALTER TABLE IF EXISTS public.api_credentials
        ADD CONSTRAINT api_credentials_tenant_user_fkey
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES public.users (tenant_id, id) MATCH SIMPLE;`,
    );

    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);
    expect(result.summary).toBe("3 tables and 2 relationships recognized");
    expect(result.edges.map((edge) => edge.data?.cardinality)).toEqual([
      "one-to-many",
      "one-to-many",
    ]);
    expect(result.edges.every((edge) => edge.data?.pathType === "step")).toBe(
      true,
    );
    expect(result.edges.map((edge) => edge.data?.label)).toEqual([
      "tenant_id",
      "tenant_id, user_id",
    ]);

    const users = result.nodes.find(
      (node) => node.data.componentName === "public.users",
    );
    const credentials = result.nodes.find(
      (node) => node.data.componentName === "public.api_credentials",
    );
    expect(users?.data.attributes).toContainEqual(
      expect.objectContaining({ name: "tenant_id", isForeignKey: true }),
    );
    expect(credentials?.data.attributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "tenant_id", isForeignKey: true }),
        expect.objectContaining({ name: "user_id", isForeignKey: true }),
      ]),
    );
  });
});
