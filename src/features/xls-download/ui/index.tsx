import React from 'react';

import { IconButton } from 'shared/ui/icon-button';
import { Scheme } from 'shared/ui/table-with-expanded-row';

import { onDownloadXlsx } from '../lib';

import xlsIcon from './xls-icon.svg';

interface IProps<T> {
  items: T[];
  viewDataFormatScheme: Scheme<T>;
}

const XlsDownload = <T extends object>({
  items,
  viewDataFormatScheme,
}: IProps<T>): JSX.Element => {
  const onClickHandler = () => onDownloadXlsx(items, viewDataFormatScheme);

  return (
    <IconButton
      className="xls"
      iconHref={xlsIcon}
      onClick={onClickHandler}
    ></IconButton>
  );
};

export default React.memo(XlsDownload) as typeof XlsDownload;
