import {
  Exclude,
  OperationType,
} from "@clubs/interface/common/utils/field-operations";

export type IdType = number | string;

export interface IEntity<Id extends IdType = number> {
  id: Id;
}

/**
 * @description patch에 넣기 위한 static M=>M 함수의 타입
 */
export type ModelPatchFunction<
  Model extends MEntity<IModel, Id>,
  Id extends IdType = number,
  IModel extends IEntity<Id> = IEntity<Id>,
> = (original: Model) => Model;

export abstract class MEntity<
  IModel extends IEntity<Id>,
  Id extends IdType = number,
> implements IEntity<Id>
{
  @Exclude(OperationType.CREATE, OperationType.PUT)
  id: Id;

  static modelName: string;

  constructor(entity: IModel) {
    Object.assign(this, entity);
  }
}
