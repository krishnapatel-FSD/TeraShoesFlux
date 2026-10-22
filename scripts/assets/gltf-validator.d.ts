// Minimal types for the Khronos glTF Validator's JS build (the package ships none).
declare module "gltf-validator" {
  interface ValidatorMessage {
    code: string;
    message: string;
    severity: number; // 0 error, 1 warning, 2 info, 3 hint
    pointer?: string;
  }
  interface ValidatorReport {
    issues: {
      numErrors: number;
      numWarnings: number;
      messages: ValidatorMessage[];
    };
  }
  const validator: {
    validateBytes(
      data: Uint8Array,
      options?: {
        uri?: string;
        maxIssues?: number;
        externalResourceFunction?: (uri: string) => Promise<Uint8Array>;
      },
    ): Promise<ValidatorReport>;
  };
  export default validator;
}
