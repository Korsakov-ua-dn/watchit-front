import React, { MouseEvent, useCallback } from "react";
import { v1 } from "uuid";
import TheadItem from "../t-head-item";
import { Direction, ViewDataFormatScheme } from "../types";

type PropsType<T> = {
  viewDataFormatScheme: ViewDataFormatScheme<T>;
  activeField: keyof T | undefined;
  direction?: Direction;
  onSort?: (field: keyof T) => void;
};

const Thead = <T,>(props: PropsType<T>): JSX.Element => {

  // Один обработчик для всех полей
  const onSort = useCallback((e: MouseEvent<HTMLElement>) => {
    const field = e.currentTarget.getAttribute('data-field') as keyof T
    props.onSort && props.onSort(field)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onSort])

  /* Первая th в массиве нужен т.к. в tbody первый элемент стрелка
     для развертывания дополнительной информации по строке */
  let thead = [<th key={"FirstTH"}></th>];

  for (let key in props.viewDataFormatScheme) {
    const id = v1();
    thead.push(
      <TheadItem
        key={id}
        value={key}
        isSort={props.viewDataFormatScheme[key]?.sort!}
        width={props.viewDataFormatScheme[key]?.width}
        viewDataFormatScheme={props.viewDataFormatScheme}
        onSort={onSort}
        isActiveField={props.activeField === key}
        direction={props.direction}
      />
    );
  }

  return (
    <thead className="Table__head">
      <tr>{thead}</tr>
    </thead>
  );
};

export default React.memo(Thead) as typeof Thead;
