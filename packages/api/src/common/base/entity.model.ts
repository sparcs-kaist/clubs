import { ExcludeInCreate } from "../util/decorators/model-property-decorator";

export type IdType = number | string;

/**
 * @description patch에 넣기 위한 static M=>M 함수의 타입
 */
export type ModelPatchFunction<
  Model extends MEntity<Id>,
  Id extends IdType = number,
> = (original: Model) => Model;

export abstract class MEntity<Id extends IdType = number> {
  @ExcludeInCreate()
  id: Id;

  static modelName: string;
}
