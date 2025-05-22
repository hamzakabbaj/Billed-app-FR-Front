import VerticalLayout from "./VerticalLayout.js";
import ErrorPage from "./ErrorPage.js";
import LoadingPage from "./LoadingPage.js";

import Actions from "./Actions.js";

const row = (bill) => {
  return `
    <tr>
      <td>${bill.type}</td>
      <td>${bill.name}</td>
      <td>${bill.date}</td>
      <td>${bill.amount} €</td>
      <td>${bill.status}</td>
      <td>
        ${Actions(bill.fileUrl)}
      </td>
    </tr>
    `;
};

const rows = (data) => {
  return data && data.length ? data.map((bill) => row(bill)).join("") : "";
};

export default ({ data: bills, loading, error }) => {
  const antiChrono = (a, b) => {
    const parseFrenchDate = (dateStr) => {
      const months = {
        "Jan.": "01",
        "Fév.": "02",
        "Mar.": "03",
        "Avr.": "04",
        "Mai.": "05",
        "Juin.": "06",
        "Juil.": "07",
        "Août.": "08",
        "Sept.": "09",
        "Oct.": "10",
        "Nov.": "11",
        "Déc.": "12",
      };

      const [day, month, year] = dateStr.split(" ");
      const formattedDate = `20${year}-${months[month]}-${day.padStart(
        2,
        "0"
      )}`;
      return new Date(formattedDate);
    };

    return parseFrenchDate(b.date) - parseFrenchDate(a.date);
  };

  // Sort bills by date in descending order (most recent first)
  if (bills) {
    console.log(
      "Before sorting bills",
      bills.map((bill) => bill.date)
    );
    bills = bills.sort(antiChrono);
    console.log(
      "After sorting bills",
      bills.map((bill) => bill.date)
    );
  }

  const modal = () => `
    <div class="modal fade" id="modaleFile" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLongTitle">Justificatif</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
        </div>
      </div>
    </div>
  `;

  if (loading) {
    return LoadingPage();
  } else if (error) {
    return ErrorPage(error);
  }

  return `
    <div class='layout'>
      ${VerticalLayout(120)}
      <div class='content'>
        <div class='content-header'>
          <div class='content-title'> Mes notes de frais </div>
          <button type="button" data-testid='btn-new-bill' class="btn btn-primary">Nouvelle note de frais</button>
        </div>
        <div id="data-table">
        <table id="example" class="table table-striped" style="width:100%">
          <thead>
              <tr>
                <th>Type</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
          </thead>
          <tbody data-testid="tbody">
            ${rows(bills)}
          </tbody>
          </table>
        </div>
      </div>
      ${modal()}
    </div>`;
};
