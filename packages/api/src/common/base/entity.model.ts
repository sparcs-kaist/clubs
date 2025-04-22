export type IdType = number | string;

export interface IEntity<Id extends IdType = number> {
  id: Id;
}

/**
 * @description patch에 넣기 위한 static M=>M 함수의 타입
 */
export type ModelPatchFunction<
  Model extends MEntity<Id>,
  Id extends IdType = number,
> = (original: Model) => Model;

export abstract class MEntity<Id extends IdType = number>
  implements IEntity<Id>
{
  id: Id;

  static modelName: string;
}
