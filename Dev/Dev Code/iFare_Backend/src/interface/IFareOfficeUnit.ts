export interface OfficeUnit {
    area: string,
    CodeDomicileID: number,
    unitDetailList: Array<OfficeUnitDetail>
}

export interface OfficeUnitDetail {
    unitName: string,
    tel: string,
    address: string
}