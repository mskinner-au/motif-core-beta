/**
 * %license Motif
 * (c) 2022 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { Guid, Integer } from '../../sys/sys-internal-api';
import { ScanStatusId } from '../common/adi-common-internal-api';

export interface ScanStatusedDescriptorInterface {
    readonly id: string;
    readonly name: string;
    readonly description: string | undefined;
    readonly readonly: boolean;
    readonly statusId: ScanStatusId;
    readonly versionNumber: Integer | undefined;
    readonly versionId: Guid | undefined;
    readonly versioningInterrupted: boolean;
    readonly lastSavedTime: Date | undefined;
    readonly lastEditSessionId: Guid | undefined;
    readonly symbolListEnabled: boolean | undefined;
    readonly zenithCriteriaSource: string | undefined;
    readonly zenithRankSource: string | undefined;
}
