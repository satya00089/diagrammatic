import { describe, expect, it } from "vitest";
import { parseExtensionSource } from "./extensionImport";

describe("database schema extension import", () => {
  it("uses the shared Entity table presentation and preserves constraints", () => {
    const result = parseExtensionSource(
      "database-schema",
      `CREATE TABLE users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE
      );

      CREATE TABLE orders (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL,
        UNIQUE (user_id, created_at)
      );`,
    );

    const users = result.nodes.find(
      (node) => node.data.componentName === "users",
    );
    const orders = result.nodes.find(
      (node) => node.data.componentName === "orders",
    );
    const userId = (
      orders?.data.attributes as Array<Record<string, unknown>>
    ).find((attribute) => attribute.name === "user_id");
    const email = (
      users?.data.attributes as Array<Record<string, unknown>>
    ).find((attribute) => attribute.name === "email");
    const userColumns = (
      users?.data.renderConfig as
        | { columns?: Array<{ key: string; label: string }> }
        | undefined
    )?.columns;
    const resolvedUserColumns = userColumns ?? [];

    expect(users?.data).toMatchObject({
      componentId: "entity",
      renderConfig: { shape: "table" },
    });
    expect(resolvedUserColumns.map((column) => column.label)).toEqual([
      "PK",
      "Column Name",
      "Data Type",
      "FK",
      "UQ",
      "NULL",
      "",
    ]);
    expect(users?.data.attributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "id",
          isPrimaryKey: true,
          isNullable: false,
        }),
      ]),
    );
    expect(email).toMatchObject({ isUnique: true, isNullable: false });
    expect(userId).toMatchObject({ isForeignKey: true, isNullable: false });
    expect(orders?.data.attributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "user_id", isUnique: true }),
        expect.objectContaining({ name: "created_at", isUnique: true }),
      ]),
    );
  });

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
    expect(result.edges[0]).toMatchObject({
      sourceHandle: "field:public.tenants-id:right",
      targetHandle: "field:public.users-tenant_id:left",
      data: {
        sourceFieldId: "public.tenants-id",
        targetFieldId: "public.users-tenant_id",
        sourceFieldIds: ["public.tenants-id"],
        targetFieldIds: ["public.users-tenant_id"],
      },
    });
    expect(result.edges[1].data).toMatchObject({
      sourceFieldIds: ["public.users-tenant_id", "public.users-id"],
      targetFieldIds: [
        "public.api_credentials-tenant_id",
        "public.api_credentials-user_id",
      ],
    });

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
  ])(
    "recognizes %s identifiers and foreign keys",
    (_dialect, schema, column) => {
      const result = parseExtensionSource("database-schema", schema);

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].data).toMatchObject({
        label: column,
        pathType: "step",
        cardinality: "one-to-many",
      });
      const sourceNode = result.nodes.find(
        (node) => node.id === result.edges[0].source,
      );
      const targetNode = result.nodes.find(
        (node) => node.id === result.edges[0].target,
      );
      const sourceAttribute = (
        sourceNode?.data.attributes as Array<{
          id: string;
          isPrimaryKey?: boolean;
        }>
      ).find((attribute) => attribute.isPrimaryKey);
      const targetAttribute = (
        targetNode?.data.attributes as Array<{
          id: string;
          name: string;
          isForeignKey?: boolean;
        }>
      ).find((attribute) => attribute.name === column);
      expect(result.edges[0].sourceHandle).toBe(
        sourceAttribute ? `field:${sourceAttribute.id}:right` : "right",
      );
      expect(result.edges[0].targetHandle).toBe(
        targetAttribute ? `field:${targetAttribute.id}:left` : "left",
      );
      expect(
        result.nodes.some((node) =>
          (
            node.data.attributes as Array<{
              name: string;
              isForeignKey?: boolean;
            }>
          ).some(
            (attribute) => attribute.name === column && attribute.isForeignKey,
          ),
        ),
      ).toBe(true);
    },
  );
});
