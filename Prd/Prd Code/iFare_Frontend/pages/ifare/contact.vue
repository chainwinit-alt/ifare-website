<template>
  <div class="app-body-child" :name="$route.name">
    <div class="section-list">
      <section class="section-top">
        <div class="title-component">
          <i class="ic-title-pattern"></i>
          <h3 class="comp-title">{{ _contactItem.title }}</h3>
          <span class="comp-shadow">CONTACT</span>
        </div>
        <div class="date-group">
          <label class="date-release">{{ releaseTime }}</label>
          <label class="date-update">{{ updateTime }}</label>
        </div>
      </section>
      <section class="section-body">
        <div class="part-areas">
          <ul class="list-unstyled area-list">
            <li
              class="area-item transition-general"
              :class="{ active: _area.isActive }"
              v-for="(_area, i) in areaList"
              :key="_area.areaName"
            >
              <a class="transition-general" :href="`#${_area.areaName}`" @click="jumpTo(_area.areaName)">{{
                _area.areaName
              }}</a>
            </li>
          </ul>
        </div>
        <div class="part-filter">
          <CompSelect
              placeholder="選擇地區"
              select-title="選擇地區"
              select-type="area"
              :select-list="areaSelectList"
              @update:select-value="getSelectValue"
              @is-opened="isSelectOpen"
            />
        </div>
        <div class="part-detail">
          <ul class="list-unstyled detail-list">
            <li
              class="detail-item"
              v-for="_contact in contactList"
              :key="_contact.area"
            >
              <h2 class="detail-name" :id="`${_contact.area}`">
                {{ _contact.area }}
              </h2>
              <div class="detail-title">
                <label class="title-name" name="unit">單位</label>
                <label class="title-name" name="tel">聯絡電話</label>
                <label class="title-name" name="address">聯絡地址</label>
              </div>
              <div class="detail-content">
                <ul class="list-unstyled content-list">
                  <li
                    class="content-item"
                    v-for="(_detail, j) in _contact.detail"
                    :key="_detail.unit"
                  >
                    <span class="content-value" name="unit">{{
                      _detail.unit
                    }}</span>
                    <div class="tel-item">
                      <i class="ic-tel"></i>
                      <span class="content-value" name="tel">{{
                        _detail.tel
                      }}</span>
                    </div>
                    <div class="address-group">
                      <div class="address-item">
                        <i class="ic-location"></i>
                        <span class="content-value" name="address">{{
                          _detail.address
                        }}</span>
                      </div>
                      <!-- <span class="content-sub-value" name="serviceArea">{{ _detail.serviceArea }}</span> -->
                    </div>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const _isSelect = ref(false)
useHead({
  bodyAttrs: {
    class: {
      "overflow-disabled": _isSelect,
      "select-mode": _isSelect
    }
  }
})
definePageMeta({
  title: 'ifare',
  toLinkName: 'i-Fare',
  toLink: '/ifare'
})
const { $WebApiGet } = useNuxtApp();
const route = useRoute();
const $router = useRouter();
const _contactID = route.query.id;

interface contact {
  area: string;
  detail: Array<contactDetail>;
}

interface contactDetail {
  unit: string;
  tel: string;
  address: string;
  serviceArea: string;
}

interface areaItem {
  isActive: boolean;
  areaName: string;
}

interface selectItem {
  name: string;
  val: string;
  isActive: boolean;
}

const areaList = reactive<Array<areaItem>>([]);
const areaSelectList = reactive<Array<selectItem>>([]);

const contactList = reactive<Array<contact>>([]);

const releaseTime = ref("");
const updateTime = ref("");

interface contactItem {
  id: number;
  title: string;
  officeList: any;
}

const _contactItem = reactive<contactItem>({
  id: 0,
  title: "",
  officeList: undefined,
});
const OfficeUnitListGet = $WebApiGet("/FareOfficeUnit/GetIFareOfficeUnitList");
OfficeUnitListGet.then((res: any) => {
  let _data = res?.result?.result;
  if (!Array.isArray(_data)) return;
  _data = _data.find((item: any) => item.id == _contactID);
  if (!_data) return;

  _contactItem.title = _data.title;
  releaseTime.value = _data.releaseTime
  updateTime.value = _data.updateTime
  (_data.officeList ?? []).forEach((_officeItem: any, k: number) => {
    console.log(_officeItem)
    areaList.push({
      isActive: k == 0,
      areaName: _officeItem.codeDomicile_LabelName,
    });
    areaSelectList.push({
      name: _officeItem.codeDomicile_LabelName,
      val: _officeItem.codeDomicile_ID,
      isActive: false
    })
    contactList.push({
      area: _officeItem.codeDomicile_LabelName,
      detail: _officeItem.unitList.map((_detail: any, j: number) => {
        return {
          unit: _detail.unitName,
          tel: _detail.tel,
          address: _detail.address,
        };
      }),
    });
  });
});

function jumpTo(areaName: string) {
  areaList.forEach((_area, i) => {
    _area.isActive = _area.areaName == areaName;
  });
}

function getSelectValue(type: string, val: string) {
  console.log(`[${type}] val => ${val}`)
  let _area = areaSelectList.find((p:any) => p.val == val);
  jumpTo(`${_area?.name}`)
  $router.push({ path: route.path, query: route.query, hash: `#${_area?.name}`})
}

function isSelectOpen(type: string, val: boolean) {
  // console.log(`[${type}] val => ${val} || type ${typeof val}`)
  _isSelect.value = val
  // useHead({
  //   bodyAttrs: {
  //     class: {
  //       "overflow-disabled": val,
  //       "select-mode": val
  //     }
  //   }
  // })
}
</script>
