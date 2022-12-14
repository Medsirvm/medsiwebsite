import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useSelector } from "react-redux";
import {
  selectCurrentNumberUserPayment,
  selectSimulationPaymentsInformation,
  selectuserInformation,
} from "../../store/reducers/user/UserAccountSlice";
import { createClientConekta, createOrderConekta } from "../../api/conekta";

const PaymentProcess = () => {
  const userInformation = useSelector(selectuserInformation);
  const { first_name, last_name, maternal_name, email, phone_number } =
    userInformation;

  const payments = useSelector(selectSimulationPaymentsInformation);
  const numberOfPaymentToPay = useSelector(selectCurrentNumberUserPayment);
  const paymentToPayInfo = payments[numberOfPaymentToPay];
  const { amount } = paymentToPayInfo;
  const [checkoutId, setCheckoutId] = useState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const fullname = `${first_name} ${last_name} ${maternal_name}`;

    const createConektaPayment = async () => {
      await createClientConekta(fullname, email, phone_number)
        .then(async (res) => {
          if (res?.data) {
            const custId = res?.data;
            console.log(custId);
            await createOrderConekta(
              res.data,
              amount,
              phone_number,
              fullname,
              email
            )
              .then((res) => {
                if (res.status === 200) {
                  setCheckoutId(res.data.idCheckout);
                  setIsReady(true);
                } else {
                  console.log("Error en el checkoutID");
                }
              })
              .catch((err) => {
                console.log("Error al crear orden: ", err);
              });
          } else {
            console.log("Algo sucedio");
          }
        })
        .catch((err) => console.log("error desde acá ", err));
    };
    createConektaPayment();
  }, [amount, email, first_name, last_name, maternal_name, phone_number]);

  useEffect(() => {
    if (isReady) {
      const s = document.createElement("script");
      console.log("This is the user information ", userInformation);
      s.type = "text/javascript";
      s.async = true;
      s.innerHTML = `
        window.ConektaCheckoutComponents.Integration({
            targetIFrame: "#conektaIframeContainer",
            checkoutRequestId: "${checkoutId}",
            publicKey: "key_Koo3RdDXsRAhe4Do0y1j8yQ",
            options: {},
            styles: {},
            onFinalizePayment: function(e){
                console.log(e.charge.status)
                var estadoPag = e.charge.status;
                var orderConekta = e.id;
                if (estadoPag == "paid"){
                    console.log("Pagado");
                }else{
                    console.log("En espera de pago");
                }
            }
        })
        `;
      document.body.appendChild(s);
      return () => {
        document.body.removeChild(s);
      };
    }
  }, [checkoutId, isReady, userInformation]);

  return (
    <Layout>
      <div id="conektaIframeContainer" style={{ height: "1350px" }}></div>
    </Layout>
  );
};

export default PaymentProcess;
