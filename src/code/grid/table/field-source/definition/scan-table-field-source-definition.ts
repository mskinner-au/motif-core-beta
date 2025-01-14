/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { Scan } from '../../../../scan/internal-api';
import { AssertInternalError, CommaText, FieldDataType, FieldDataTypeId, Integer } from '../../../../sys/sys-internal-api';
import {
    BooleanCorrectnessTableField,
    CorrectnessTableField,
    DateCorrectnessTableField,
    EnumCorrectnessTableField,
    IntegerArrayCorrectnessTableField,
    IntegerCorrectnessTableField,
    StringCorrectnessTableField,
    TableField
} from "../../field/grid-table-field-internal-api";
import {
    CorrectnessTableValue,
    DateTimeCorrectnessTableValue,
    EnabledCorrectnessTableValue,
    IntegerCorrectnessTableValue,
    LitIvemIdArrayCorrectnessTableValue,
    MarketIdArrayCorrectnessTableValue,
    ScanStatusIdCorrectnessTableValue,
    ScanTargetTypeIdCorrectnessTableValue,
    StringCorrectnessTableValue,
    WritableCorrectnessTableValue
} from '../../value/grid-table-value-internal-api';
import { TableFieldSourceDefinition } from './table-field-source-definition';

/** @public */
export class ScanTableFieldSourceDefinition extends TableFieldSourceDefinition {
    override readonly fieldDefinitions: TableField.Definition[];

    constructor() {
        super(TableFieldSourceDefinition.TypeId.Scan);

        this.fieldDefinitions = this.createFieldDefinitions();
    }

    isFieldSupported(id: Scan.FieldId) {
        return ScanTableFieldSourceDefinition.Field.isIdSupported(id);
    }

    getFieldNameById(id: Scan.FieldId) {
        const sourcelessFieldName = Scan.Field.idToName(id);
        return CommaText.from2Values(this.name, sourcelessFieldName);
    }

    getSupportedFieldNameById(id: Scan.FieldId) {
        if (!this.isFieldSupported(id)) {
            throw new AssertInternalError('STFSDGSFNBI30398', Scan.Field.idToName(id));
        } else {
            return this.getFieldNameById(id);
        }
    }

    private createFieldDefinitions() {
        const count = ScanTableFieldSourceDefinition.Field.count;
        const result = new Array<TableField.Definition>(count);

        for (let fieldIdx = 0; fieldIdx < count; fieldIdx++) {
            const sourcelessFieldName = ScanTableFieldSourceDefinition.Field.getName(fieldIdx);
            const heading = ScanTableFieldSourceDefinition.Field.getHeading(fieldIdx);
            const dataTypeId = ScanTableFieldSourceDefinition.Field.getDataTypeId(fieldIdx);
            const textAlign = FieldDataType.idIsNumber(dataTypeId) ? 'right' : 'left';
            const [fieldConstructor, valueConstructor] =
                ScanTableFieldSourceDefinition.Field.getTableFieldValueConstructors(fieldIdx);

            result[fieldIdx] = new TableField.Definition(
                this,
                sourcelessFieldName,
                heading,
                textAlign,
                fieldConstructor,
                valueConstructor,
            );
        }

        return result;
    }
}

/** @public */
export namespace ScanTableFieldSourceDefinition {
    export namespace Field {
        const unsupportedIds: Scan.FieldId[] = [
            Scan.FieldId.Index,
            Scan.FieldId.ZenithCriteria,
            Scan.FieldId.ZenithRank,
            Scan.FieldId.ZenithCriteriaSource,
            Scan.FieldId.ZenithRankSource,
            Scan.FieldId.LastEditSessionId,
        ];
        export const count = Scan.Field.idCount - unsupportedIds.length;

        interface Info {
            readonly id: Scan.FieldId;
            readonly tableFieldValueConstructors: [field: CorrectnessTableField.Constructor, value: CorrectnessTableValue.Constructor];
        }

        const infos: Info[] = [
            {
                id: Scan.FieldId.Id,
                tableFieldValueConstructors: [StringCorrectnessTableField, StringCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.Readonly,
                tableFieldValueConstructors: [BooleanCorrectnessTableField, WritableCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.StatusId,
                tableFieldValueConstructors: [EnumCorrectnessTableField, ScanStatusIdCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.Name,
                tableFieldValueConstructors: [StringCorrectnessTableField, StringCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.Description,
                tableFieldValueConstructors: [StringCorrectnessTableField, StringCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.TargetTypeId,
                tableFieldValueConstructors: [EnumCorrectnessTableField, ScanTargetTypeIdCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.TargetMarkets,
                tableFieldValueConstructors: [IntegerArrayCorrectnessTableField, MarketIdArrayCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.TargetLitIvemIds,
                tableFieldValueConstructors: [IntegerArrayCorrectnessTableField, LitIvemIdArrayCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.MaxMatchCount,
                tableFieldValueConstructors: [IntegerCorrectnessTableField, IntegerCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.SymbolListEnabled,
                tableFieldValueConstructors: [BooleanCorrectnessTableField, EnabledCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.Version,
                tableFieldValueConstructors: [StringCorrectnessTableField, StringCorrectnessTableValue],
            },
            {
                id: Scan.FieldId.LastSavedTime,
                tableFieldValueConstructors: [DateCorrectnessTableField, DateTimeCorrectnessTableValue],
            },
        ];

        const idFieldIndices = new Array<Integer>(Scan.Field.idCount);

        export function initialise() {
            for (let id = 0; id < Scan.Field.idCount; id++) {
                idFieldIndices[id] = -1;
            }

            for (let fieldIndex = 0; fieldIndex < count; fieldIndex++) {
                const id = infos[fieldIndex].id;
                if (unsupportedIds.includes(id)) {
                    throw new AssertInternalError('STFSDFII42422', fieldIndex.toString());
                } else {
                    if (idFieldIndices[id] !== -1) {
                        throw new AssertInternalError('STFSDFID42422', fieldIndex.toString()); // duplicate
                    } else {
                        idFieldIndices[id] = fieldIndex;
                    }
                }
            }
        }

        export function isIdSupported(id: Scan.FieldId) {
            return !unsupportedIds.includes(id);
        }

        export function indexOfId(id: Scan.FieldId) {
            return idFieldIndices[id];
        }

        export function getId(fieldIdx: Integer) {
            return infos[fieldIdx].id;
        }

        export function getName(fieldIdx: Integer) {
            return Scan.Field.idToName(infos[fieldIdx].id);
        }

        export function getHeading(fieldIdx: Integer) {
            return Scan.Field.idToHeading(infos[fieldIdx].id);
        }

        export function getDataTypeId(fieldIdx: Integer): FieldDataTypeId {
            return Scan.Field.idToFieldDataTypeId(infos[fieldIdx].id);
        }

        export function getTableFieldValueConstructors(fieldIndex: Integer) {
            return infos[fieldIndex].tableFieldValueConstructors;
        }

        export function getTableValueConstructor(fieldIndex: Integer): CorrectnessTableValue.Constructor {
            const constructors = getTableFieldValueConstructors(fieldIndex);
            return constructors[1];
        }
    }

    export interface FieldId extends TableFieldSourceDefinition.FieldId {
        sourceTypeId: TableFieldSourceDefinition.TypeId.Scan;
        id: Scan.FieldId;
    }

    export function initialiseStatic() {
        Field.initialise();
    }
}
