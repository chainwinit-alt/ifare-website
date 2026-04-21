export interface ColumnInfo {
    prop: string,
    label: string,
    opts?: any
}

interface TbDataInfo_Basic {
    id: number,
    title?: string,
    state_release: string,
    state_data: string,
    user_create: string,
    date_create: string,
    user_update: string,
    date_update: string
}

export interface TbDataInfo_News extends TbDataInfo_Basic {
    date_release: string,
    date_discontinued: string
}

export interface TbDataInfo_ArticlesWelfare extends TbDataInfo_Basic {
    policy: string,
    keyword: string
}

export interface TbDataInfo_ArticlesLazy extends TbDataInfo_Basic {
    keyword: string
}

export interface TbDataInfo_IFarePolicy extends TbDataInfo_Basic {
    policy: string,
    domicile: string,
    keyword: string
}

export interface TbDataInfo_IFareOfficeUnit extends TbDataInfo_Basic {
}

export interface TbDataInfo_IFareQA extends TbDataInfo_Basic {
}

export interface TbDataInfo_Collaborator extends TbDataInfo_Basic {
}

export interface TbDataInfo_CodeDomicile extends TbDataInfo_Basic {
}
export interface TbDataInfo_CodeIdentity extends TbDataInfo_Basic {
}
export interface TbDataInfo_CodeIncome extends TbDataInfo_Basic {
}
export interface TbDataInfo_CodeKeyword extends TbDataInfo_Basic {
}
export interface TbDataInfo_CodePolicy extends TbDataInfo_Basic {
}
export interface TbDataInfo_CodeRecipient extends TbDataInfo_Basic {
}

export interface TbDataInfo_Account extends TbDataInfo_Basic {
    account: string,
    user_name: string,
    user_email: string,
    permission: string
}

export interface TbDataInfo_ImgManager extends TbDataInfo_Basic {
    type: string,
    imgPath: string,
    size: number
}