/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { LitIvemId } from '../adi/adi-internal-api';
import {
    AssertInternalError, Integer
} from "../sys/sys-internal-api";
import {
    JsonRankedLitIvemIdListDefinition
} from "./definition/ranked-lit-ivem-id-list-definition-internal-api";
import { IndexRankScoredLitIvemIdSourceList } from './index-rank-scored-lit-ivem-id-source-list';
import { RankScoredLitIvemIdSourceList } from './rank-scored-lit-ivem-id-source-list';
import { ScoredRankedLitIvemIdList } from './scored-ranked-lit-ivem-id-list';

export class JsonScoredRankedLitIvemIdList extends ScoredRankedLitIvemIdList {
    readonly name: string;
    readonly description: string;
    readonly category: string;

    declare protected _sourceList: IndexRankScoredLitIvemIdSourceList;
    private readonly _initialLitIvemIds: readonly LitIvemId[];

    constructor(definition: JsonRankedLitIvemIdListDefinition) {
        super(definition, true, true, true, true);
        this.name = definition.name;
        this.description = definition.description;
        this.category = definition.category;
        this._initialLitIvemIds = definition.litIvemIds;
    }

    override createDefinition(): JsonRankedLitIvemIdListDefinition {
        const litIvemIds = this.getLitIvemIds().slice();
        return new JsonRankedLitIvemIdListDefinition(this.id, this.name, this.description, this.category, litIvemIds);
    }

    override subscribeRankScoredLitIvemIdSourceList(): RankScoredLitIvemIdSourceList {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._sourceList !== undefined) {
            // cannot open more than once
            throw new AssertInternalError('ERLIILISRSLIISL31314');
        } else {
            this._sourceList = new IndexRankScoredLitIvemIdSourceList(
                this._initialLitIvemIds,
                () => this.notifySourceListModified(),
            );
            return this._sourceList;
        }
    }

    override unsubscribeRankScoredLitIvemIdSourceList(): void {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._sourceList === undefined) {
            throw new AssertInternalError('ERLIILIURSLIISL31314');
        } else {
            this._sourceList = undefined as unknown as IndexRankScoredLitIvemIdSourceList;
        }
    }

    override userAdd(litIvemId: LitIvemId): Integer {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._sourceList === undefined) {
            throw new AssertInternalError('ERLIILIUA31314');
        } else {
            return this._sourceList.add(litIvemId);
        }
    }

    override userAddArray(litIvemIds: LitIvemId[]): void {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._sourceList === undefined) {
            throw new AssertInternalError('ERLIILIUAA31314');
        } else {
            this._sourceList.addArray(litIvemIds);
        }
    }

    override userReplaceAt(index: Integer, litIvemIds: LitIvemId[]): void {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._sourceList === undefined) {
            throw new AssertInternalError('ERLIILIURPA31314');
        } else {
            this._sourceList.replaceAt(index, litIvemIds);
        }
    }

    override userRemoveAt(index: Integer, count: Integer): void {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._sourceList === undefined) {
            throw new AssertInternalError('ERLIILIURMA31314');
        } else {
            this._sourceList.removeAt(index, count);
        }
    }

    override userMoveAt(fromIndex: Integer, count: Integer, toIndex: Integer): void {
        throw new Error('Method not implemented.');
    }

    set(litIvemIds: LitIvemId[]): void {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._sourceList === undefined) {
            throw new AssertInternalError('ERLIILIS31314');
        } else {
            this._sourceList.set(litIvemIds);
        }
    }

    private notifySourceListModified() {
        if (this.referentialTargettedModifiedEventer !== undefined) {
            this.referentialTargettedModifiedEventer();
        }
    }

    private getLitIvemIds() {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._sourceList === undefined) {
            throw new AssertInternalError('ERLIILIGLII31314')
        } else {
            return this._sourceList.litIvemIds;
        }
    }
}

export namespace JsonScoredRankedLitIvemIdList {
    export type ModifiedEventer = (this: void) => void;
}