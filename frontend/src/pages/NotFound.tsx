import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Circuit404 from "@/components/errors/Circuit404";

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "404 — Route Not Found | HBTronics";

    return () => {
      document.title = "HBTronics";
    };
  }, []);

  return (
    <Circuit404
      onBack={() => {
        navigate("/");
      }}
    />
  );
}