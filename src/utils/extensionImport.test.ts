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

  it.each([
    [
      "MySQL",
      `CREATE TABLE \`customers\` (
        \`id\` bigint NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
      CREATE TABLE \`orders\` (
        \`id\` bigint NOT NULL,
        \`customer_id\` bigint NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`orders_customer_fk\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`)
      ) ENGINE=InnoDB;`,
      "customer_id",
    ],
    [
      "Oracle",
      `CREATE TABLE "APP"."USERS" (
        "ID" NUMBER(19) NOT NULL,
        CONSTRAINT "USERS_PK" PRIMARY KEY ("ID")
      );
      CREATE TABLE "APP"."ORDERS" (
        "ID" NUMBER(19) NOT NULL,
        "USER_ID" NUMBER(19) NOT NULL,
        CONSTRAINT "ORDERS_PK" PRIMARY KEY ("ID")
      );
      ALTER TABLE "APP"."ORDERS" ADD CONSTRAINT "ORDERS_USER_FK"
        FOREIGN KEY ("USER_ID") REFERENCES "APP"."USERS" ("ID");`,
      "user_id",
    ],
    [
      "SQL Server",
      `CREATE TABLE [dbo].[accounts] (
        [id] int NOT NULL,
        CONSTRAINT [accounts_pk] PRIMARY KEY ([id])
      );
      CREATE TABLE [dbo].[invoices] (
        [id] int NOT NULL,
        [account_id] int NOT NULL
      );
      ALTER TABLE [dbo].[invoices] ADD CONSTRAINT [invoices_account_fk]
        FOREIGN KEY ([account_id]) REFERENCES [dbo].[accounts] ([id]);`,
      "account_id",
    ],
  ])("recognizes %s identifiers and foreign keys", (_dialect, schema, column) => {
    const result = parseExtensionSource("database-schema", schema);

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].data).toMatchObject({
      label: column,
      pathType: "step",
      cardinality: "one-to-many",
    });
    expect(
      result.nodes.some((node) =>
        (node.data.attributes as Array<{ name: string; isForeignKey?: boolean }>).some(
          (attribute) => attribute.name === column && attribute.isForeignKey,
        ),
      ),
    ).toBe(true);
  });
});
