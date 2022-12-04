/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { FieldDataType, FieldDataTypeId, LitIvemAlternateCodes } from '../../../../adi/adi-internal-api';
import { AssertInternalError, CommaText, Integer, UnreachableCaseError } from '../../../../sys/sys-internal-api';
import { GridFieldSourceDefinition } from '../../../field/grid-field-internal-api';
import { CorrectnessTableField, StringCorrectnessTableField, TableFieldDefinition } from '../../field/grid-table-field-internal-api';
import { CorrectnessTableValue, StringCorrectnessTableValue } from '../../value/grid-table-value-internal-api';
import { TableFieldCustomHeadingsService } from './table-field-custom-headings-service';
import { TableFieldSourceDefinition } from './table-field-source-definition';

export class LitIvemAlternateCodesTableFieldSourceDefinition extends TableFieldSourceDefinition {
    override readonly fieldDefinitions: TableFieldDefinition[];

    constructor(customHeadingsService: TableFieldCustomHeadingsService) {
        super(
            customHeadingsService,
            TableFieldSourceDefinition.TypeId.LitIvemAlternateCodes,
            LitIvemAlternateCodesTableFieldSourceDefinition.name,
        );

        this.fieldDefinitions = LitIvemAlternateCodesTableFieldSourceDefinition.createFieldDefinitions(customHeadingsService, this);
    }

    isFieldSupported(id: LitIvemAlternateCodes.Field.Id) {
        return LitIvemAlternateCodesTableFieldSourceDefinition.Field.isIdSupported(id);
    }

    getFieldNameById(id: LitIvemAlternateCodes.Field.Id) {
        const sourcelessFieldName = LitIvemAlternateCodesTableFieldSourceDefinition.Field.getNameById(id);
        return CommaText.from2Values(this.name, sourcelessFieldName);
    }

    getSupportedFieldNameById(id: LitIvemAlternateCodes.Field.Id) {
        if (!this.isFieldSupported(id)) {
            throw new AssertInternalError('LIACTFSDGSFNBI30299', LitIvemAlternateCodes.Field.idToName(id));
        } else {
            return this.getFieldNameById(id);
        }
    }
}

export namespace LitIvemAlternateCodesTableFieldSourceDefinition {
    export type SourceName = typeof name;
    export const name = 'Liac';

    export namespace Field {
        const unsupportedIds: LitIvemAlternateCodes.Field.Id[] = [];
        export const count = LitIvemAlternateCodes.Field.idCount - unsupportedIds.length;

        interface Info {
            readonly id: LitIvemAlternateCodes.Field.Id;
            readonly fieldConstructor: CorrectnessTableField.Constructor;
            readonly valueConstructor: CorrectnessTableValue.Constructor;
        }

        const infos = new Array<Info>(count);
        const idFieldIndices = new Array<Integer>(LitIvemAlternateCodes.Field.idCount);

        function idToTableGridConstructors(id: LitIvemAlternateCodes.Field.Id):
            TableFieldSourceDefinition.CorrectnessTableGridConstructors {
            switch (id) {
                case LitIvemAlternateCodes.Field.Id.Ticker:
                case LitIvemAlternateCodes.Field.Id.Gics:
                case LitIvemAlternateCodes.Field.Id.Isin:
                case LitIvemAlternateCodes.Field.Id.Ric:
                case LitIvemAlternateCodes.Field.Id.Base:
                    return [StringCorrectnessTableField, StringCorrectnessTableValue];
                default:
                    throw new UnreachableCaseError('LIACTFDSFITTGC5699945', id);
            }
        }

        export function getId(fieldIdx: Integer) {
            return infos[fieldIdx].id;
        }

        export function getName(fieldIdx: Integer) {
            return LitIvemAlternateCodes.Field.idToName(infos[fieldIdx].id);
        }

        export function getNameById(id: LitIvemAlternateCodes.Field.Id) {
            return LitIvemAlternateCodes.Field.idToName(id);
        }

        export function getHeading(fieldIdx: Integer) {
            return LitIvemAlternateCodes.Field.idToHeading(infos[fieldIdx].id);
        }

        export function getDataTypeId(fieldIdx: Integer): FieldDataTypeId {
            return LitIvemAlternateCodes.Field.idToFieldDataTypeId(infos[fieldIdx].id);
        }

        export function getTableFieldConstructor(fieldIdx: Integer) {
            return infos[fieldIdx].fieldConstructor;
        }

        export function getTableValueConstructor(fieldIdx: Integer) {
            return infos[fieldIdx].valueConstructor;
        }

        export function indexOfId(id: LitIvemAlternateCodes.Field.Id) {
            return idFieldIndices[id];
        }

        export function isIdSupported(id: LitIvemAlternateCodes.Field.Id) {
            return !unsupportedIds.includes(id);
        }

        export function initialiseFieldStatic() {
            let fieldIdx = 0;
            for (let id = 0; id < LitIvemAlternateCodes.Field.idCount; id++) {
                if (unsupportedIds.includes(id)) {
                    idFieldIndices[id] = -1;
                } else {
                    idFieldIndices[id] = fieldIdx;

                    const [fieldConstructor, valueConstructor] = idToTableGridConstructors(id);
                    infos[fieldIdx++] = {
                        id,
                        fieldConstructor,
                        valueConstructor,
                    } as const;
                }
            }
        }
    }

    export function initialiseStatic() {
        Field.initialiseFieldStatic();
    }

    export function createFieldDefinitions(
        customHeadingsService: TableFieldCustomHeadingsService,
        gridFieldSourceDefinition: GridFieldSourceDefinition
    ) {
        const result = new Array<TableFieldDefinition>(LitIvemAlternateCodesTableFieldSourceDefinition.Field.count);

        let idx = 0;
        for (let fieldIdx = 0; fieldIdx < LitIvemAlternateCodesTableFieldSourceDefinition.Field.count; fieldIdx++) {
            const sourcelessFieldName = LitIvemAlternateCodesTableFieldSourceDefinition.Field.getName(fieldIdx);
            const fieldName = CommaText.from2Values(name, sourcelessFieldName);
            let heading: string;
            const customHeading = customHeadingsService.tryGetFieldHeading(fieldName, sourcelessFieldName);
            if (customHeading !== undefined) {
                heading = customHeading;
            } else {
                heading = LitIvemAlternateCodesTableFieldSourceDefinition.Field.getHeading(fieldIdx);
            }

            const dataTypeId = LitIvemAlternateCodesTableFieldSourceDefinition.Field.getDataTypeId(fieldIdx);
            const textAlign = FieldDataType.idIsNumber(dataTypeId) ? 'right' : 'left';
            const fieldConstructor = LitIvemAlternateCodesTableFieldSourceDefinition.Field.getTableFieldConstructor(fieldIdx);
            const valueConstructor = LitIvemAlternateCodesTableFieldSourceDefinition.Field.getTableValueConstructor(fieldIdx);

            result[idx++] = new TableFieldDefinition(
                fieldName,
                heading,
                textAlign,
                gridFieldSourceDefinition,
                sourcelessFieldName,
                fieldConstructor,
                valueConstructor,
            );
        }

        return result;
    }
}
