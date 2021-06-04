import React, { useState } from "react";
import { Alert } from "react-bootstrap";
import useInput from "../../../hook/useInput";
import "./WhiteListPanel.css";

const WhiteListPanel = (props) => {
  const { whitelist, updateWhitelist } = props;
  const [addr, bindAddr, resetAddr] = useInput("");

  const addrItems = whitelist.map((el, id) => {
    return (
      <Alert
        variant="success"
        key={id}
        dismissible
        onClose={() => updateWhitelist(whitelist.filter((it) => it !== el))}
      >
        {el}
      </Alert>
    );
  });

  const addAddr = () => {
    if (addr === "") return;
    const addrIndex = whitelist.findIndex((el) => el === addr);
    if (addrIndex >= 0) return;
    updateWhitelist([...whitelist, addr]);
    resetAddr();
  };
  return (
    <>
      <div>
        <input
          className="text-input float-input"
          type="text"
          placeholder="Add addresses to whitelist"
          {...bindAddr}
        ></input>
        <button type="button" className="add-btn" onClick={addAddr}>
          Add
        </button>
      </div>
      <div className="mt-3">{addrItems}</div>
    </>
  );
};

export default WhiteListPanel;
