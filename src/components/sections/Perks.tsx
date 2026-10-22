import { Icon } from "@/components/ui/Icons";

export function Perks() {
  return (
    <section className="block" style={{ paddingTop: 0 }}>
      <div className="rail perks" data-stagger>
        <div className="perk">
          <i>
            <Icon name="truck" />
          </i>
          <h3>Free shipping over $150</h3>
          <p>Standard delivery in 2 to 4 business days. Express from $15.</p>
        </div>
        <div className="perk">
          <i>
            <Icon name="return" />
          </i>
          <h3>60-day returns</h3>
          <p>
            Run in them for two months. If they don&apos;t work, send them back
            free.
          </p>
        </div>
        <div className="perk">
          <i>
            <Icon name="loop" />
          </i>
          <h3>$20 for your old pair</h3>
          <p>
            Send any worn running shoe back with your order and get $20 off.
          </p>
        </div>
        <div className="perk">
          <i>
            <Icon name="leaf" />
          </i>
          <h3>Plastic-free packaging</h3>
          <p>Orders ship in recycled boxes with paper fill.</p>
        </div>
      </div>
    </section>
  );
}
