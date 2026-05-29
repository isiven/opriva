import { getLocalStoreRecords, getModuleColumns, getRecordCell } from './recordSelectors.js';

export function getImportedClientRows(workspaceMode) {
  return getLocalStoreRecords('clients', workspaceMode).map(function(record) { return record.row; });
}

export function getImportedRenewalRows(workspaceMode) {
  var isIT = workspaceMode === 'Internal IT';
  var licenses = getLocalStoreRecords('licenses', workspaceMode);
  var hardware = getLocalStoreRecords('hardware', workspaceMode);
  var contracts = getLocalStoreRecords('contracts', workspaceMode);
  var licenseColumns = getModuleColumns('licenses', workspaceMode);
  var hardwareColumns = getModuleColumns('hardware', workspaceMode);
  var contractColumns = getModuleColumns('contracts', workspaceMode);
  return licenses.map(function(record) {
    return isIT
      ? {
          record: getRecordCell(record, licenseColumns, ['License / Product']) || record.meta.displayName,
          type: 'License',
          brand: getRecordCell(record, licenseColumns, ['Brand']) || record.meta.brandManufacturer || '-',
          provider: getRecordCell(record, licenseColumns, ['Provider']) || record.meta.providerDistributor || '-',
          department: getRecordCell(record, licenseColumns, ['Department']) || record.meta.clientDepartment || '-',
          expiry: getRecordCell(record, licenseColumns, ['Renewal']) || record.meta.expirationRenewalDate || '-',
          amount: getRecordCell(record, licenseColumns, ['Value']) || '-',
          approval: getRecordCell(record, licenseColumns, ['Approval status']) || 'Pending review',
          risk: getRecordCell(record, licenseColumns, ['Status']) || 'Review',
          action: getRecordCell(record, licenseColumns, ['Action']) || 'Review import'
        }
      : {
          record: getRecordCell(record, licenseColumns, ['License / Product']) || record.meta.displayName,
          type: 'License',
          vendor: getRecordCell(record, licenseColumns, ['Brand']) || record.meta.brandManufacturer || '-',
          expiry: getRecordCell(record, licenseColumns, ['Renewal']) || record.meta.expirationRenewalDate || '-',
          days: '-',
          value: getRecordCell(record, licenseColumns, ['Value']) || '-',
          owner: getRecordCell(record, licenseColumns, ['Owner']) || 'Unassigned',
          status: getRecordCell(record, licenseColumns, ['Status']) || 'Review',
          action: getRecordCell(record, licenseColumns, ['Action']) || 'Review import'
        };
  }).concat(hardware.map(function(record) {
    return isIT
      ? {
          record: getRecordCell(record, hardwareColumns, ['Asset']) || record.meta.displayName,
          type: 'Hardware',
          brand: getRecordCell(record, hardwareColumns, ['Brand']) || record.meta.brandManufacturer || '-',
          provider: getRecordCell(record, hardwareColumns, ['Provider']) || record.meta.providerDistributor || '-',
          department: getRecordCell(record, hardwareColumns, ['Department']) || record.meta.clientDepartment || '-',
          expiry: getRecordCell(record, hardwareColumns, ['Warranty end']) || record.meta.expirationRenewalDate || '-',
          amount: '-',
          approval: getRecordCell(record, hardwareColumns, ['Approval status']) || 'Pending review',
          risk: getRecordCell(record, hardwareColumns, ['Status']) || 'Review',
          action: getRecordCell(record, hardwareColumns, ['Action']) || 'Review import'
        }
      : {
          record: getRecordCell(record, hardwareColumns, ['Asset']) || record.meta.displayName,
          type: 'Hardware',
          vendor: getRecordCell(record, hardwareColumns, ['Brand']) || record.meta.brandManufacturer || '-',
          expiry: getRecordCell(record, hardwareColumns, ['Warranty end']) || record.meta.expirationRenewalDate || '-',
          days: '-',
          value: '-',
          owner: getRecordCell(record, hardwareColumns, ['Owner']) || 'Unassigned',
          status: getRecordCell(record, hardwareColumns, ['Status']) || 'Review',
          action: getRecordCell(record, hardwareColumns, ['Action']) || 'Review import'
        };
  })).concat(contracts.map(function(record) {
    return isIT
      ? {
          record: getRecordCell(record, contractColumns, ['Contract']) || record.meta.displayName,
          type: 'Contract',
          brand: '-',
          provider: getRecordCell(record, contractColumns, ['Provider']) || record.meta.providerDistributor || '-',
          department: getRecordCell(record, contractColumns, ['Department']) || record.meta.clientDepartment || '-',
          expiry: getRecordCell(record, contractColumns, ['Renewal']) || record.meta.expirationRenewalDate || '-',
          amount: '-',
          approval: getRecordCell(record, contractColumns, ['Approval status']) || 'Pending review',
          risk: getRecordCell(record, contractColumns, ['Risk']) || 'Review',
          action: getRecordCell(record, contractColumns, ['Next action']) || 'Review import'
        }
      : {
          record: getRecordCell(record, contractColumns, ['Contract']) || record.meta.displayName,
          type: 'Contract',
          vendor: getRecordCell(record, contractColumns, ['Provider / Distributor']) || record.meta.providerDistributor || '-',
          expiry: getRecordCell(record, contractColumns, ['Renewal']) || record.meta.expirationRenewalDate || '-',
          days: '-',
          value: '-',
          owner: getRecordCell(record, contractColumns, ['Owner']) || 'Unassigned',
          status: getRecordCell(record, contractColumns, ['Legal status']) || 'Review',
          action: getRecordCell(record, contractColumns, ['Next action']) || 'Review import'
        };
  }));
}

export function getImportedDashboardPriorityRows(workspaceMode) {
  var isIT = workspaceMode === 'Internal IT';
  var licenseColumns = getModuleColumns('licenses', workspaceMode);
  var hardwareColumns = getModuleColumns('hardware', workspaceMode);
  var contractColumns = getModuleColumns('contracts', workspaceMode);
  var licenses = getLocalStoreRecords('licenses', workspaceMode).map(function(record) {
    if (isIT) {
      return [
        getRecordCell(record, licenseColumns, ['License / Product']) || record.meta.displayName || 'Imported license',
        'License',
        getRecordCell(record, licenseColumns, ['Brand']) || record.meta.brandManufacturer || '-',
        getRecordCell(record, licenseColumns, ['Provider']) || record.meta.providerDistributor || '-',
        getRecordCell(record, licenseColumns, ['Renewal']) || record.meta.expirationRenewalDate || '-',
        getRecordCell(record, licenseColumns, ['Value']) || '-',
        getRecordCell(record, licenseColumns, ['Department']) || record.meta.clientDepartment || '-',
        'Review import'
      ];
    }
    return [
      getRecordCell(record, licenseColumns, ['Client']) || record.meta.clientDepartment || '-',
      getRecordCell(record, licenseColumns, ['Brand']) || record.meta.brandManufacturer || '-',
      getRecordCell(record, licenseColumns, ['License / Product']) || record.meta.productLicenseName || 'Imported license',
      getRecordCell(record, licenseColumns, ['Distributor']) || record.meta.providerDistributor || '-',
      getRecordCell(record, licenseColumns, ['Renewal']) || record.meta.expirationRenewalDate || '-',
      getRecordCell(record, licenseColumns, ['Value']) || '-',
      getRecordCell(record, licenseColumns, ['Margin']) || '-',
      getRecordCell(record, licenseColumns, ['Owner']) || 'Unassigned',
      'Review import'
    ];
  });
  var hardware = getLocalStoreRecords('hardware', workspaceMode).map(function(record) {
    if (isIT) {
      return [
        getRecordCell(record, hardwareColumns, ['Asset']) || record.meta.displayName || 'Imported hardware',
        'Hardware',
        getRecordCell(record, hardwareColumns, ['Brand']) || record.meta.brandManufacturer || '-',
        getRecordCell(record, hardwareColumns, ['Provider']) || record.meta.providerDistributor || '-',
        getRecordCell(record, hardwareColumns, ['Warranty end']) || record.meta.expirationRenewalDate || '-',
        '-',
        getRecordCell(record, hardwareColumns, ['Department']) || record.meta.clientDepartment || '-',
        'Review import'
      ];
    }
    return [
      getRecordCell(record, hardwareColumns, ['Client']) || record.meta.clientDepartment || '-',
      getRecordCell(record, hardwareColumns, ['Brand']) || record.meta.brandManufacturer || '-',
      getRecordCell(record, hardwareColumns, ['Asset']) || record.meta.productLicenseName || 'Imported hardware',
      getRecordCell(record, hardwareColumns, ['Support']) || record.meta.providerDistributor || '-',
      getRecordCell(record, hardwareColumns, ['Warranty end']) || record.meta.expirationRenewalDate || '-',
      '-',
      '-',
      getRecordCell(record, hardwareColumns, ['Owner']) || 'Unassigned',
      'Review import'
    ];
  });
  var contracts = getLocalStoreRecords('contracts', workspaceMode).map(function(record) {
    if (isIT) {
      return [
        getRecordCell(record, contractColumns, ['Contract']) || record.meta.displayName || 'Imported contract',
        'Contract',
        '-',
        getRecordCell(record, contractColumns, ['Provider']) || record.meta.providerDistributor || '-',
        getRecordCell(record, contractColumns, ['Renewal']) || record.meta.expirationRenewalDate || '-',
        '-',
        getRecordCell(record, contractColumns, ['Department']) || record.meta.clientDepartment || '-',
        'Review import'
      ];
    }
    return [
      getRecordCell(record, contractColumns, ['Client']) || record.meta.clientDepartment || '-',
      '-',
      getRecordCell(record, contractColumns, ['Contract']) || record.meta.displayName || 'Imported contract',
      getRecordCell(record, contractColumns, ['Provider / Distributor']) || record.meta.providerDistributor || '-',
      getRecordCell(record, contractColumns, ['Renewal']) || record.meta.expirationRenewalDate || '-',
      '-',
      '-',
      getRecordCell(record, contractColumns, ['Owner']) || 'Unassigned',
      'Review import'
    ];
  });
  return licenses.concat(hardware).concat(contracts).slice(0, 5);
}
