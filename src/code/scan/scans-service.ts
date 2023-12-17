/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { AdiService } from '../adi/adi-internal-api';
import { SymbolsService } from '../services/services-internal-api';
import {
    ErrorCode,
    Integer,
    LockOpenListItem,
    MultiEvent,
    Ok,
    Result,
    UsableListChangeTypeId
} from "../sys/sys-internal-api";
import { Scan } from './scan';
import { ScanEditor } from './scan-editor';
import { ScanList } from './scan-list';

/** @public */
export class ScansService {
    readonly scanList: ScanList;

    private _scanWaiters = new Array<ScansService.ScanWaiter>();

    private _openedScanEditors = new Map<Scan, ScanEditor>();

    private _scanListChangeSubscriptionId: MultiEvent.SubscriptionId;

    constructor(
        private readonly _adiService: AdiService,
        private readonly _symbolsService: SymbolsService
    ) {
        this.scanList = new ScanList(this._adiService);
    }

    initialise() {
        this.scanList.initialise();
        this._scanListChangeSubscriptionId = this.scanList.subscribeListChangeEvent(
            (listChangeTypeId, index, count) => { this.handleScanListChangeEvent(listChangeTypeId, index, count); }
        );
    }

    finalise() {
        this.scanList.unsubscribeListChangeEvent(this._scanListChangeSubscriptionId);
        this._scanListChangeSubscriptionId = undefined;
        this.scanList.finalise();
    }

    openNewScanEditor(opener: LockOpenListItem.Opener, errorEventer?: ScanEditor.ErrorEventer): ScanEditor {
        return new ScanEditor(
            this._adiService,
            this._symbolsService,
            undefined,
            opener,
            (createdScanId) => this.getOrWaitForScan(createdScanId),
            errorEventer,
        );
    }

    async tryOpenScanEditor(scanId: string | undefined, opener: LockOpenListItem.Opener, errorEventer?: ScanEditor.ErrorEventer): Promise<Result<ScanEditor | undefined>> {
        if (scanId === undefined) {
            return new Ok(this.openNewScanEditor(opener));
        } else {
            const lockResult = await this.scanList.tryLockItemByKey(scanId, opener);
            if (lockResult.isErr()) {
                return lockResult.createOuter(ErrorCode.ScansService_TryOpenScanEditor_LockScan);
            } else {
                const scan = lockResult.value;
                if (scan === undefined) {
                    return new Ok(undefined);
                } else {
                    this.scanList.openLockedItem(scan, opener)
                    let openedEditor = this._openedScanEditors.get(scan);
                    if (openedEditor === undefined) {
                        openedEditor = new ScanEditor(
                            this._adiService,
                            this._symbolsService,
                            scan,
                            opener,
                            (createdScanId) => this.getOrWaitForScan(createdScanId),
                            errorEventer,
                        );
                        this._openedScanEditors.set(scan, openedEditor);
                    }
                    openedEditor.addOpener(opener);
                    return new Ok(openedEditor);
                }
            }
        }
    }

    closeScanEditor(scanEditor: ScanEditor, opener: LockOpenListItem.Opener) {
        const scan = scanEditor.scan;
        if (scan !== undefined) {
            scanEditor.removeOpener(opener);
            if (scanEditor.openCount === 0) {
                scanEditor.finalise();
                this._openedScanEditors.delete(scan);
            }

            this.scanList.closeLockedItem(scan, opener);
            this.scanList.unlockItem(scan, opener);
        }
    }

    // protected override processItemAdded(scan: Scan) {
    //     this._scanChangedSubscriptionId = scan.subscribeValuesChangedEvent(
    //         (changedFieldIds, configChanged) => this.processScanFieldsChangedEvent(
    //             scan,
    //             changedFieldIds,
    //             configChanged
    //         )
    //     );
    // }

    // private processScanFieldsChangedEvent(scan: Scan, changedFieldIds: readonly Scan.FieldId[], configChanged: boolean) {

    // }

    private handleScanListChangeEvent(listChangeTypeId: UsableListChangeTypeId, index: Integer, count: Integer) {
        if (this._scanWaiters.length > 0) {
            switch (listChangeTypeId) {
                case UsableListChangeTypeId.PreUsableAdd:
                case UsableListChangeTypeId.Insert: {
                    const afterRangeIndex = index + count;
                    for (let i = index; i < afterRangeIndex; i++) {
                        const scan = this.scanList.getAt(i);
                        this.checkResolveScanWaiters(scan);
                    }
                }
            }
        }
    }

    // private syncDescriptors(index: Integer, count: Integer) {
    //     const nextIndex = index + count;
    //     const addedScans = new Array<Scan>(count);
    //     let addCount = 0;
    //     for (let i = index; i < nextIndex; i++) {
    //         const scanDescriptor = this._scanDescriptorsDataItem.records[i];
    //         const id = scanDescriptor.id;
    //         const scan = this.getItemByKey(id);
    //         if (scan !== undefined) {
    //             scan.sync(scanDescriptor);
    //         } else {
    //             const addedScan = new Scan(
    //                 this._adiService,
    //                 scanDescriptor
    //             );
    //             addedScans[addCount++] = addedScan;
    //         }
    //     }

    //     if (addCount > 0) {
    //         this.addItems(addedScans);
    //     }
    // }

    // private deleteScans(index: Integer, count: Integer) {
    //     //
    // }

    // private offlineAllScans(serverDeleted: boolean) {
    //     // for (const scan of this._scans) {
    //     //     scan.checkSetOffline();
    //     // }
    // }

    private getOrWaitForScan(scanId: string): Promise<Scan> {
        const scan = this.scanList.getItemByKey(scanId);
        if (scan !== undefined) {
            return Promise.resolve(scan);
        } else {
            return new Promise<Scan>((resolve) => {
                const scanWaiter: ScansService.ScanWaiter = {
                    scanId,
                    resolve,
                }
                this._scanWaiters.push(scanWaiter);
            });

        }
    }

    private checkResolveScanWaiters(scan: Scan) {
        const scanId = scan.id;
        const waiters = this._scanWaiters;
        const waiterCount = waiters.length;
        for (let i = waiterCount - 1; i >= 0; i--) {
            const waiter = waiters[i];
            if (waiter.scanId === scanId) {
                const resolve = waiter.resolve;
                resolve(scan);
                waiters.splice(i, 1);
            }
        }
    }
}

/** @public */
export namespace ScansService {
    export type CorrectnessChangedEventHandler = (this: void) => void;
    export type BadnessChangeEventHandler = (this: void) => void;

    export type ScansOnlineResolve = (this: void, ready: boolean) => void;
    export type CreatedScanWaitingResolve = (this: void, scan: Scan) => void;
    export interface ScanWaiter {
        scanId: string;
        resolve: CreatedScanWaitingResolve;
    }

/*
    export interface InitialScan {
        name: string;
        targetTypeId: ScanTargetTypeId;
        targetMarkets: readonly MarketId[] | undefined;
        targetLitIvemIds: readonly LitIvemId[] | undefined;
        matchCount: Integer;
        criteriaTypeId: EditableScan.CriteriaTypeId;
        modifiedStatusId: EditableScan.ModifiedStatusId;
    }

    export const initialScans: InitialScan[] = [
        {
            name: 'BHP Last Price > 50',
            targetTypeId: ScanTargetTypeId.Symbols,
            targetMarkets: undefined,
            targetLitIvemIds: [new LitIvemId('BHP', MarketId.AsxTradeMatch, DataEnvironmentId.Sample)],
            matchCount: 0,
            criteriaTypeId: EditableScan.CriteriaTypeId.PriceGreaterThanValue,
            modifiedStatusId: EditableScan.ModifiedStatusId.Unmodified,
        },
        {
            name: 'CBA Bid price increase > 10%',
            targetTypeId: ScanTargetTypeId.Symbols,
            targetMarkets: undefined,
            targetLitIvemIds: [new LitIvemId('CBA', MarketId.AsxTradeMatch, DataEnvironmentId.Sample)],
            matchCount: 0,
            criteriaTypeId: EditableScan.CriteriaTypeId.TodayPriceIncreaseGreaterThanPercentage,
            modifiedStatusId: EditableScan.ModifiedStatusId.Unmodified,
        },
        {
            name: 'BHP or RIO Bid price increase > 10%',
            targetTypeId: ScanTargetTypeId.Symbols,
            targetMarkets: undefined,
            targetLitIvemIds: [
                new LitIvemId('BHP', MarketId.AsxTradeMatch, DataEnvironmentId.Sample),
                new LitIvemId('RIO', MarketId.AsxTradeMatch, DataEnvironmentId.Sample),
            ],
            matchCount: 0,
            criteriaTypeId: EditableScan.CriteriaTypeId.TodayPriceIncreaseGreaterThanPercentage,
            modifiedStatusId: EditableScan.ModifiedStatusId.Unmodified,
        },
        {
            name: 'CBA bid price > last price',
            targetTypeId: ScanTargetTypeId.Symbols,
            targetMarkets: undefined,
            targetLitIvemIds: [new LitIvemId('CBA', MarketId.AsxTradeMatch, DataEnvironmentId.Sample)],
            matchCount: 0,
            criteriaTypeId: EditableScan.CriteriaTypeId.Custom,
            modifiedStatusId: EditableScan.ModifiedStatusId.Unmodified,
        },
        {
            name: 'Any bank has auction price 10% > last price',
            targetTypeId: ScanTargetTypeId.Markets,
            targetMarkets: [MarketId.AsxTradeMatch],
            targetLitIvemIds: undefined,
            matchCount: 0,
            criteriaTypeId: EditableScan.CriteriaTypeId.Custom,
            modifiedStatusId: EditableScan.ModifiedStatusId.Unmodified,
        },
    ];
*/
}
