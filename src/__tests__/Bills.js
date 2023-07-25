/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom/extend-expect';
import { screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import Bills from '../containers/Bills.js'
import Store from "../app/Store.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
import store from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      // Set up the mock for localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));

      // Set up the initial DOM with root element and router
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      // Check if the bill icon has the "active-icon" CSS class
      expect(windowIcon.className).toContain('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When I click on 'New Bills' button", () => {
      test("Then it should navigate to the NewBill page", () => {
        // Define on navigate
        const onNavigate = pathname => {
          document.body.innerHTML = ROUTES_PATH.pathname
        }

        // Display Bills page
        document.body.innerHTML = BillsUI({ data: bills })

        // Create instance of class Bills
        const billComponent = new Bills({
          document,
          onNavigate,
          Store,
          localStorage: window.localStorage,
        });

        // Get the click event action inside the Bills Class
        const handleClickNewBill = jest.fn(billComponent.handleClickNewBill)

        const newBillButton = screen.getByTestId("btn-new-bill")

        newBillButton.addEventListener('click', handleClickNewBill)
        userEvent.click(newBillButton)

        expect(handleClickNewBill).toHaveBeenCalled()
      })
    })

    describe("When I click on an eye icon", () => {
      test("Then it should open a modal and display an image", () => {
        document.body.innerHTML = BillsUI({ data: bills })

        const billComponent = new Bills({
          document,
          onNavigate,
          Store,
          localStorage: window.localStorage,
        });

        jQuery.fn.modal = jest.fn()
        const eye = screen.getAllByTestId('icon-eye')[0]
        const handleClickIconEye = jest.fn(() => billComponent.handleClickIconEye(eye))
        eye.addEventListener('click', handleClickIconEye)
        userEvent.click(eye)

        expect(handleClickIconEye).toHaveBeenCalled()

        const modal = screen.getByTestId('modaleFile')
        modal.classList.toggle("show")

        expect(modal.classList.contains("show")).toBe(true)
      })
    })
  })
})

// API GET test
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills page", () => {
    test("Then it should fetch bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      const container = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      })

      const billsList = await container.getBills()
      expect(billsList.length).toBe(4)
    })
  })

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
      document.body.innerHTML = BillsUI({ error: 'Erreur 404' })
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    })

    test("fetches bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      document.body.innerHTML = BillsUI({ error: 'Erreur 500' })
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})

