import React from "react";

export const SortItems = {
  date: "date",
  playerNum: "playerNum",
  size: "size",
};
export const SortLabels = {
  date: "Newest",
  playerNum: "Number of players",
  size: "Biggest size",
};

export const sortPools = (pool1, pool2, sortType) => {
  switch (sortType) {
    case SortItems.date:
      return pool2.createdDate - pool1.createdDate;
    case SortItems.playerNum:
      return 0;
    case SortItems.size:
      return pool2.maxCap - pool1.maxCap;
    default:
      return 0;
  }
};

const SortPanel = (props) => {
  const { value, setValue } = props;
  const optionItems = Object.keys(SortItems).map((el, id) => {
    return (
      <option key={id} value={SortItems[el]}>
        {SortLabels[el]}
      </option>
    );
  });
  return (
    <>
      <span className="white small-text">Sort by:</span>
      <select
        className="sort-by ml-2 small-text"
        name="Sort by"
        value={value}
        onChange={(e) => setValue && setValue(e.target.value)}
      >
        {optionItems}
      </select>
    </>
  );
};

export default SortPanel;