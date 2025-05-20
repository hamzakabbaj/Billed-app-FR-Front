/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    test("Then clicking on the eye icon should call handleClickIconEye and show the modal", () => {
      // Set up the DOM with a modal and an icon-eye
      document.body.innerHTML = BillsUI({ data: bills });

      // Set up the DOM with the modal
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // Instantiate Bills
      const onNavigate = jest.fn();
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // Mock jQuery functions
      $.fn.modal = jest.fn();

      // Spy on handleClickIconEye
      const handleClickIconEyeSpy = jest.spyOn(
        billsContainer,
        "handleClickIconEye"
      );

      // Get the icon eye and simulate click
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      iconEye.click();

      // Check that handleClickIconEye was called with the icon
      expect(handleClickIconEyeSpy).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled();
    });

    test("Then clicking on the New Bill button should navigate to the NewBill page", () => {
      // Set up the DOM
      document.body.innerHTML = BillsUI({ data: bills });

      // Create a mock onNavigate function
      const onNavigate = jest.fn();

      // Instantiate Bills
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // Spy on the handleClickNewBill method after instantiation
      const handleClickNewBillSpy = jest.spyOn(
        billsContainer,
        "handleClickNewBill"
      );

      // Get the New Bill button and simulate click
      const newBillButton = document.querySelector(
        `button[data-testid="btn-new-bill"]`
      );

      // Make sure the button exists
      expect(newBillButton).not.toBeNull();

      // Simulate click
      newBillButton.click();

      // Check that onNavigate was called with the correct route
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);

      // Clean up the spy
      handleClickNewBillSpy.mockRestore();
    });

    test("Then getBills should handle corrupted date data gracefully", async () => {
      // Create a mock store with a bills method that returns a list method
      const mockStore = {
        bills: () => ({
          list: () =>
            Promise.resolve([
              // Valid bill with proper date
              { id: 1, date: "2023-01-01", status: "pending" },
              // Corrupted bill with invalid date that will cause formatDate to fail
              { id: 2, date: "invalid-date", status: "pending" },
            ]),
        }),
      };

      // Spy on console.log to verify error logging
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Instantiate Bills with the mock store
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Call getBills and wait for the promise to resolve
      const result = await billsContainer.getBills();

      // Verify that console.log was called with the error
      expect(consoleSpy).toHaveBeenCalled();

      // Verify that the result contains both bills
      expect(result.length).toBe(2);

      // Verify that the first bill has formatted date
      // The actual format is "D MMM. YY" (e.g., "1 Jan. 23")
      expect(result[0].date).toMatch(/^\d{1,2} [A-Za-z]{3}\. \d{2}$/);

      // Verify that the second bill has the original unformatted date
      expect(result[1].date).toBe("invalid-date");

      // Clean up the spy
      consoleSpy.mockRestore();
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  // beforeEach(() => {
  //   // Clean up before each test
  //   document.body.innerHTML = "";
  // });
  describe("When I navigate to Bills page", () => {
    test("Fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const contentPending = await screen.getByText("pending");
      expect(contentPending).toBeTruthy();
      const contentAccepted = await screen.getByText("accepted");
      expect(contentAccepted).toBeTruthy();
      const contentRefused = await screen.getAllByText("refused");
      expect(contentRefused).toBeTruthy();
      expect(screen.getAllByTestId("btn-new-bill")).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
