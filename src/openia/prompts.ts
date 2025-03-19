
const objectToReturn = JSON.stringify({
    "Identificacao do Emitente": {
        "Nome": "",
        "Morada": "",
        "NIF": "",
        "Contacto": ""
    },
    "Identificacao do Cliente": {
        "Nome": "",
        "NIF": "",
        "Morada": ""
    },
    "Data e Hora da Factura": {
        "Data": "",
        "Hora": ""
    },
    "Numero da Factura": {
        "Factura-recibo": "",
        "Documentos referenciados": ""
    },
    "Valor Total": "KZ 500,00",
    "IVA e Base Tributavel": {
        "Base tributavel": "",
        "IVA (%)": "",
        "Valor Total com IVA": ""
    },
    "Pagamento": {
        "Forma de pagamento": "",
        "Valor": ""
    },
    "Outras Informacoes": {
        "Software": "",
        "Emp.": "",
        "Data de processamento": ""
    }
})

export const prompt = `Extrai as informações da factura acima, para um modelo de comprovativo de despesas de representação:
    1.	Identificação do Emitente: Inclua ‘Nome’, ‘Morada’, ‘NIF’ e ‘Contacto’.
    2.	Identificação do Cliente: Inclua ‘Nome’, ‘NIF’ e ‘Morada’.
    3.	Data e Hora da Factura: Inclua ‘Data’ e ‘Hora’.
    4.	Número da Factura: Inclua ‘Factura-recibo’ e ‘Documentos referenciados’.
    5.	Valor Total: Inclua o campo ‘Total’.
    6.	IVA e Base Tributável: Inclua ‘Base tributável’, ‘IVA (%)’ e ‘Valor Total com IVA’.
    7.	Pagamento: Inclua ‘Forma de pagamento’ e ‘Valor’.
    8.	Outras Informações: Inclua ‘Software’, ‘Emp.’ e ‘Data de processamento’.
retorne em formato json igual a esse: ${objectToReturn}.`;