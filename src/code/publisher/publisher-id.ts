/**
 * @license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { StringId, Strings } from '../res/res-internal-api';
import { EnumInfoOutOfOrderError, Err, ExternalError, Ok, PublisherError, Result } from '../sys/sys-internal-api';
import { PublisherIdDefinition } from './publisher-id-definition';

/** @public */
export interface PublisherId {
    readonly typeId: PublisherId.TypeId;
    readonly name: string;
}

/** @public */
export namespace PublisherId {
    export const internalName = 'Internal';

    export const invalid: PublisherId = {
        typeId: TypeId.Invalid,
        name: '',
    } as const;

    export const internal: PublisherId = {
        typeId: TypeId.Builtin,
        name: internalName,
    } as const;

    export const enum TypeId {
        Invalid,
        Builtin,
        User,
        Organisation,
    }

    export namespace Type {
        interface Info {
            readonly id: TypeId;
            readonly jsonValue: string;
            readonly displayId: StringId;
            readonly abbreviatedDisplayId: StringId;
        }

        type InfosObject = { [id in keyof typeof TypeId]: Info };

        const infosObject: InfosObject = {
            Invalid: {
                id: TypeId.Invalid,
                jsonValue: 'Invalid',
                displayId: StringId.PublisherTypeId_Display_Invalid,
                abbreviatedDisplayId: StringId.PublisherTypeId_Abbreviation_Invalid,
            },
            Builtin: {
                id: TypeId.Builtin,
                jsonValue: 'Builtin',
                displayId: StringId.PublisherTypeId_Display_Builtin,
                abbreviatedDisplayId: StringId.PublisherTypeId_Abbreviation_Builtin,
            },
            User: {
                id: TypeId.User,
                jsonValue: 'User',
                displayId: StringId.PublisherTypeId_Display_User,
                abbreviatedDisplayId: StringId.PublisherTypeId_Abbreviation_User,
            },
            Organisation: {
                id: TypeId.Organisation,
                jsonValue: 'Organisation',
                displayId: StringId.PublisherTypeId_Display_Organisation,
                abbreviatedDisplayId: StringId.PublisherTypeId_Abbreviation_Organisation,
            },
        } as const;

        const infos = Object.values(infosObject);
        const idCount = infos.length;

        export function initialise() {
            for (let i = 0; i < idCount; i++) {
                const info = infos[i];
                if (info.id !== i) {
                    throw new EnumInfoOutOfOrderError('ExtensionInfo.PublisherTypeId', i, Strings[info.displayId]);
                }
            }
        }

        export function idToJsonValue(id: TypeId) {
            return infos[id].jsonValue;
        }

        export function tryJsonValueToId(value: string) {
            for (let i = 0; i < idCount; i++) {
                const info = infos[i];
                if (info.jsonValue === value) {
                    return i;
                }
            }
            return undefined;
        }

        export function idToName(id: TypeId) {
            return idToJsonValue(id);
        }

        export function tryNameToId(value: string) {
            return tryJsonValueToId(value);
        }

        export function idToPersistKey(id: TypeId) {
            return idToJsonValue(id);
        }

        export function idToDisplayId(id: TypeId) {
            return infos[id].displayId;
        }

        export function idToDisplay(id: TypeId) {
            return Strings[idToDisplayId(id)];
        }

        export function idToAbbreviatedDisplayId(id: TypeId) {
            return infos[id].abbreviatedDisplayId;
        }

        export function idToAbbreviatedDisplay(id: TypeId) {
            return Strings[idToAbbreviatedDisplayId(id)];
        }
    }

    export function isEqual(left: PublisherId, right: PublisherId) {
        return left.name === right.name && left.typeId === right.typeId;
    }

    export function tryCreateFromDefiniton(value: PublisherIdDefinition): Result<PublisherId, PublisherError> {
        const typeName = value.type;
        const typeId = PublisherId.Type.tryNameToId(typeName);
        if (typeId === undefined) {
            return new Err(new PublisherError(ExternalError.Code.PublisherId_TypeIsInvalid, `"${typeName}"`));
        } else {
            const name = value.name;
            if (name === '') {
                return new Err(new PublisherError(ExternalError.Code.PublisherId_NameIsInvalid, `"${name}"`));
            } else {
                const publisherId: PublisherId = {
                    typeId,
                    name,
                };

                return new Ok(publisherId);
            }
        }
    }

    export function createDefinition(value: PublisherId): PublisherIdDefinition {
        return {
            type: PublisherId.Type.idToJsonValue(value.typeId),
            name: value.name,
        } as const;
    }
}

export namespace PublisherIdModule {
    export function initialiseStatic() {
        PublisherId.Type.initialise();
    }
}
