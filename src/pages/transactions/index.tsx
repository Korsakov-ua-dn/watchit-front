import React, {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { debounce } from "lodash";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchAllTransactions, transactionActions } from "../../store/transaction-slice";
import { Transaction } from "../../api/api.types";
import { useReactToPrint } from "react-to-print";
import { useTranslation } from "../../utils/translate/use-translate";
import { onDownloadXlsx } from "../../utils/on-download-xlsx";
import {
  getPrintPdfSettings,
  sortArrayOfObjects,
  viewDataScheme,
} from "./transactions.services";
import { Search, Sort } from "./transactions.types";
import ExpandedContent from "../../components/expanded-content";
import TableComponent from "../../components/table-component";
import TBody from "../../components/table-component/t-body";
import THead from "../../components/table-component/t-head";
import TableControls from "../../components/table-controls";
import Download from "../../components/table-controls/download";
import SearchPanel from "../../components/table-controls/search-panel";
import Pagination from "../../components/pagination";
// From MUI
import { SelectChangeEvent } from "@mui/material/Select";
import { geocode } from "../../geocode-services";

const Transactions: React.FC = () => {
  const dispatch = useAppDispatch();

  const select = useAppSelector((state) => ({
    transactions: state.transactions.data,
    limit: state.transactions.limit,
    page: state.transactions.page,
    selected: state.transactions.limit,
    loading: state.transactions.loading,
    error: state.transactions.error,
    locale: state.app.locale,
  }));

  const [search, setSearch] = useState<Search>(null);
  const [sort, setSort] = useState<Sort>(null);

  // Отфильтрованный массив транзакций по поиску
  const filteredTransactions = useMemo<Transaction[]>(() => {
    if (search) {
      // Поиск не чувствительный к регистру
      const regex = new RegExp(`${search.value}`, "i");
      return select.transactions.filter((item) =>
        regex.test(String(item[search.field]))
      );
      //Поиск чувствительный к регистру
      // return select.transactions.filter((item) =>
      //   String(item[search.field]).includes(search.value)
      // );
    } else return select.transactions;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.value, select.transactions]);

  // Отсортированный массив транзакций
  const sortTransactions = useMemo<Transaction[]>(() => {
    if (sort) {
      return sortArrayOfObjects(
        filteredTransactions,
        sort.field,
        sort.direction,
        sort.format
      );
    } else return filteredTransactions;
  }, [filteredTransactions, sort]);

  // Отфильтрованный массив транзакций для рендера постранично
  const transactionsForView = useMemo<Transaction[]>(() => {
    return sortTransactions.filter(
      (_, i) =>
        i < select.limit * (select.page + 1) && i >= select.limit * select.page
    );
  }, [select.limit, select.page, sortTransactions]);

  const translate = useTranslation("table", select.locale);

  // Три рефа нужны для печати пдф
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  // Мемоизация динамически генерируемого коллбэка
  const printFuncRef = useRef<() => void>();
  printFuncRef.current = useReactToPrint(
    getPrintPdfSettings(tableWrapperRef, tableRef)
  );

  const callbacks = {
    changeRowsPerPage: useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        dispatch(transactionActions.setLimit(Number(e.target.value)));
    }, [dispatch]),

    changePage: useCallback(
      (e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        dispatch(transactionActions.setPage(newPage));
    }, [dispatch]),

    onSearch: useMemo(() => debounce((value: string) => {
      setSearch((prev) => (prev ? { ...prev, value } : null));
    }, 300), []),

    onSelectSearchField: useCallback((e: SelectChangeEvent) => {
      const field = e.target.value as keyof Transaction;
      setSearch({ field, value: "" });
    }, []),

    onSort: useCallback((field: keyof Transaction) => {
      const format = viewDataScheme[field]?.format!;
      setSort((prev) => {
        if (prev?.field !== field || prev?.direction === "none") {
          return { field, format, direction: "ascending" };
        }
        if (prev?.direction === "ascending") {
          return { field, format, direction: "descending" };
        }
        if (prev?.direction === "descending") {
          return { field, format, direction: "none" };
        }
        return { field, format, direction: "none" };
      });
    }, []),

    onDownloadXlsx: useCallback(() => {
      onDownloadXlsx(transactionsForView, viewDataScheme);
    }, [transactionsForView]),

    memoizedPrintPdf: useCallback(() => {
      printFuncRef.current && printFuncRef.current();
    }, []),
  };

  useLayoutEffect(() => {
    geocode.init();
    dispatch(fetchAllTransactions());
  }, [dispatch]);

  return (
    <>
      {select.loading && "Загрузка информации..."}

      {select.error && select.error}

      {!!select.transactions.length && (
        <>
          <TableControls>
            <>
              <Download 
                onPrintPdf={callbacks.memoizedPrintPdf} 
                onDownloadXlsx={callbacks.onDownloadXlsx}
              />
              <SearchPanel
                viewDataFormatScheme={viewDataScheme}
                searchField={search?.field}
                onSearch={callbacks.onSearch}
                onSelectField={callbacks.onSelectSearchField}
                translate={translate}
              />
            </>
          </TableControls>
          
          <TableComponent
            colorScheme="zebra"
            tableWrapperRef={tableWrapperRef}
            tableRef={tableRef}
          >
            <>
              <THead
                viewDataFormatScheme={viewDataScheme}
                onSort={callbacks.onSort}
                activeField={sort?.field}
                direction={sort?.direction}
              />
              <TBody
                items={transactionsForView}
                viewDataFormatScheme={viewDataScheme}
                getExpandedContentComponent={(info) => (
                  <ExpandedContent info={info} />
                )}
              />
            </>
          </TableComponent>

          <Pagination
            count={sortTransactions.length}
            page={select.page}
            rowsPerPage={select.limit}
            onPageChange={callbacks.changePage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage={translate("show")}
            onRowsPerPageChange={callbacks.changeRowsPerPage}
            labelDisplayedRows={(info) =>
              `${translate("page")} ${info.page + 1} 
               ${translate("of")} ${Math.ceil(info.count / select.limit) || 1}`
            }
          />
          
        </>
      )}
    </>
  );
};

export default React.memo(Transactions) as typeof Transactions;