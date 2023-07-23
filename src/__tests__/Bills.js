/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom/extend-expect';
import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

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
      // check if the bill icon has the "active-icon" CSS class
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
        // Get the "New Bills" button and trigger the click event
        const newBillsButton = screen.getByTestId('btn-new-bill');
        fireEvent.click(newBillsButton);

        // Verify if window.location.pathname was updated with the correct path
        expect(window.location.pathname).toBe(ROUTES_PATH.NewBill);
      })
    })

    describe("When I click on the 'Eye' icon", () => {
      test("Then the modal should display the correct bill image", async () => {
        // Set up the initial DOM with BillsUI containing bill data
        document.body.innerHTML = BillsUI({ data: bills });
        const eyeIcon = screen.getAllByTestId('icon-eye')[0];
        const modal = document.getElementById('modaleFile');
        fireEvent.click(eyeIcon);
        // Wait for the modal to be displayed
        await waitFor(() => {
          expect(modal).toBeVisible();
        });
        const modalImage = modal.querySelector('img');
        const billUrl = eyeIcon.getAttribute('data-bill-url');
        expect(modalImage.src).toBe(billUrl);
      });
    });
  })
})
