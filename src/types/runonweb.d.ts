// runonweb se publica como TypeScript sin compilar y usa dos globales que
// no están en lib.dom de TypeScript 5.9. Bastan las firmas que lee.
// (Si algún día se instala @webgpu/types, la interfaz GPU se fusiona.)

interface GPU {
  requestAdapter(): Promise<{
    features?: { has(name: string): boolean };
  } | null>;
}

// Solo se usa en `typeof WorkerGlobalScope === "undefined"`.
// eslint-disable-next-line no-var -- una global se declara con var
declare var WorkerGlobalScope: unknown;
