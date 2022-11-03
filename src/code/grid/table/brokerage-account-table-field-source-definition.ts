/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { Account, FieldDataType, FieldDataTypeId } from '../../adi/adi-internal-api';
import { AssertInternalError, CommaText, Integer, UnreachableCaseError } from '../../sys/sys-internal-api';
import { TextFormatterService } from '../../text-format/text-format-internal-api';
import { TableFieldCustomHeadingsService } from './table-field-custom-headings-service';
import { TableFieldSourceDefinition } from './table-field-source-definition';
import {
    CorrectnessTableGridField,
    EnumDataItemTableGridField,
    StringDataItemTableGridField
} from './table-grid-field';
import {
    CorrectnessTableGridValue,
    CurrencyIdCorrectnessTableGridValue,
    DataEnvironmentIdCorrectnessTableGridValue,
    StringCorrectnessTableGridValue
} from './table-grid-value';

export class BrokerageAccountTableFieldSourceDefinition extends TableFieldSourceDefinition {

    constructor(textFormatterService: TextFormatterService, customHeadingsService: TableFieldCustomHeadingsService) {
        const fieldInfos = BrokerageAccountTableFieldSourceDefinition.createFieldInfos(customHeadingsService);

        super(
            textFormatterService,
            customHeadingsService,
            TableFieldSourceDefinition.TypeId.BrokerageAccounts,
            BrokerageAccountTableFieldSourceDefinition.sourceName,
            fieldInfos
        );
    }

    isFieldSupported(id: Account.FieldId) {
        return BrokerageAccountTableFieldSourceDefinition.Field.isIdSupported(id);
    }

    getFieldNameById(id: Account.FieldId) {
        const sourcelessFieldName = BrokerageAccountTableFieldSourceDefinition.Field.getNameById(id);
        return CommaText.from2Values(this.sourceName, sourcelessFieldName);
    }

    getSupportedFieldNameById(id: Account.FieldId) {
        if (!this.isFieldSupported(id)) {
            throw new AssertInternalError('BATFSDGSFNBI30399', Account.Field.idToName(id));
        } else {
            return this.getFieldNameById(id);
        }
    }
}

export namespace BrokerageAccountTableFieldSourceDefinition {
    export type SourceName = typeof sourceName;
    export const sourceName = 'Ba';

    export namespace Field {
        const unsupportedIds = [Account.FieldId.EnvironmentId];
        export const count = Account.Field.idCount - unsupportedIds.length;

        interface Info {
            readonly id: Account.FieldId;
            readonly fieldConstructor: CorrectnessTableGridField.Constructor;
            readonly valueConstructor: CorrectnessTableGridValue.Constructor;
        }

        const infos = new Array<Info>(count);
        const idFieldIndices = new Array<Integer>(Account.Field.idCount);

        function idToTableGridConstructors(id: Account.FieldId):
            TableFieldSourceDefinition.CorrectnessTableGridConstructors {
            switch (id) {
                case Account.FieldId.Id:
                    return [StringDataItemTableGridField, StringCorrectnessTableGridValue];
                case Account.FieldId.Name:
                    return [StringDataItemTableGridField, StringCorrectnessTableGridValue];
                case Account.FieldId.CurrencyId:
                    return [EnumDataItemTableGridField, CurrencyIdCorrectnessTableGridValue];
                case Account.FieldId.EnvironmentId:
                    return [EnumDataItemTableGridField, DataEnvironmentIdCorrectnessTableGridValue];
                case Account.FieldId.BrokerCode:
                    return [StringDataItemTableGridField, StringCorrectnessTableGridValue];
                case Account.FieldId.BranchCode:
                    return [StringDataItemTableGridField, StringCorrectnessTableGridValue];
                case Account.FieldId.AdvisorCode:
                    return [StringDataItemTableGridField, StringCorrectnessTableGridValue];
                default:
                    throw new UnreachableCaseError('BATFDSFITTGC1200049', id);
            }
        }

        export function getId(fieldIdx: Integer) {
            return infos[fieldIdx].id;
        }

        export function getName(fieldIdx: Integer) {
            return Account.Field.idToName(infos[fieldIdx].id);
        }

        export function getNameById(id: Account.FieldId) {
            return Account.Field.idToName(id);
        }

        export function getHeading(fieldIdx: Integer) {
            return Account.Field.idToHeading(infos[fieldIdx].id);
        }

        export function getDataTypeId(fieldIdx: Integer): FieldDataTypeId {
            return Account.Field.idToFieldDataTypeId(infos[fieldIdx].id);
        }

        export function getTableGridFieldConstructor(fieldIdx: Integer) {
            return infos[fieldIdx].fieldConstructor;
        }

        export function getTableGridValueConstructor(fieldIdx: Integer) {
            return infos[fieldIdx].valueConstructor;
        }

        export function indexOfId(id: Account.FieldId) {
            return idFieldIndices[id];
        }

        export function isIdSupported(id: Account.FieldId) {
            return !unsupportedIds.includes(id);
        }

        export function initialiseFieldStatic() {
            let fieldIdx = 0;
            for (let id = 0; id < Account.Field.idCount; id++) {
                if (unsupportedIds.includes(id)) {
                    idFieldIndices[id] = -1;
                } else {
                    idFieldIndices[id] = fieldIdx;

                    const [fieldConstructor, valueConstructor] = idToTableGridConstructors(id);
                    infos[fieldIdx++] = {
                        id,
                        fieldConstructor,
                        valueConstructor,
                    };
                }
            }
        }
    }

    export function initialiseStatic() {
        Field.initialiseFieldStatic();
    }

    export function createFieldInfos(customHeadingsService: TableFieldCustomHeadingsService) {
        const result = new Array<TableFieldSourceDefinition.FieldInfo>(BrokerageAccountTableFieldSourceDefinition.Field.count);
        let idx = 0;
        for (let fieldIdx = 0; fieldIdx < BrokerageAccountTableFieldSourceDefinition.Field.count; fieldIdx++) {
            const sourcelessFieldName = BrokerageAccountTableFieldSourceDefinition.Field.getName(fieldIdx);
            const name = CommaText.from2Values(sourceName, sourcelessFieldName);
            let heading: string;
            const customHeading = customHeadingsService.tryGetFieldHeading(sourceName, sourcelessFieldName);
            if (customHeading !== undefined) {
                heading = customHeading;
            } else {
                heading = BrokerageAccountTableFieldSourceDefinition.Field.getHeading(fieldIdx);
            }

            const dataTypeId = BrokerageAccountTableFieldSourceDefinition.Field.getDataTypeId(fieldIdx);
            const textAlign = FieldDataType.idIsNumber(dataTypeId) ? 'right' : 'left';
            const fieldConstructor = BrokerageAccountTableFieldSourceDefinition.Field.getTableGridFieldConstructor(fieldIdx);
            const valueConstructor = BrokerageAccountTableFieldSourceDefinition.Field.getTableGridValueConstructor(fieldIdx);

            result[idx++] = {
                sourcelessName: sourcelessFieldName,
                name,
                heading,
                textAlign,
                gridFieldConstructor: fieldConstructor,
                gridValueConstructor: valueConstructor,
            };
        }

        return result;
    }
}
